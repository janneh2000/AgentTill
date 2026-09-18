// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title AgentTill
/// @notice Policy-bound agentic USDC till / micropayment desk for Circle Arc.
/// @dev Owner deposits USDC into escrow; registered agents spend only within policy
///      (max per payment, daily/session caps, optional payee allowlist, memo flag).
contract AgentTill is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    struct Policy {
        uint256 maxPerPayment; // USDC 6 decimals; 0 = no per-payment limit beyond budget
        uint256 dailyCap; // USDC spent per UTC day; 0 = unlimited
        uint256 sessionCap; // lifetime spend for this till session; 0 = unlimited
        bool allowlistEnabled; // if true, payee must be on allowlist
        bool memoRequired; // if true, reason string must be non-empty
    }

    struct AgentInfo {
        bool registered;
        string name;
        uint256 spent; // lifetime spend by this agent (6 decimals)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Immutables / state
    // ─────────────────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;

    Policy public policy;
    uint256 public budget; // remaining spendable USDC (6 decimals)
    uint256 public sessionSpent;
    uint256 public dailySpent;
    uint256 public currentDay; // floor(block.timestamp / 1 days)

    mapping(address => AgentInfo) public agents;
    mapping(address => bool) public allowlist;
    address[] private _agentList;
    address[] private _allowlistKeys;

    uint256 public paymentCount;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event TillFunded(address indexed from, uint256 amount, uint256 newBudget);
    event TillWithdrawn(address indexed to, uint256 amount, uint256 newBudget);
    event AgentRegistered(address indexed agent, string name);
    event AgentRevoked(address indexed agent);
    event PolicyUpdated(
        uint256 maxPerPayment,
        uint256 dailyCap,
        uint256 sessionCap,
        bool allowlistEnabled,
        bool memoRequired
    );
    event AllowlistUpdated(address indexed payee, bool allowed);
    event PaymentExecuted(
        uint256 indexed paymentId,
        address indexed agent,
        address indexed payee,
        uint256 amount,
        string reason,
        uint256 remainingBudget
    );
    event TillPaused(address indexed by);
    event TillUnpaused(address indexed by);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error ZeroAddress();
    error ZeroAmount();
    error NotAgent();
    error AgentAlreadyRegistered();
    error InsufficientBudget();
    error ExceedsMaxPerPayment();
    error ExceedsDailyCap();
    error ExceedsSessionCap();
    error PayeeNotAllowed();
    error MemoRequired();
    error InsufficientAllowanceOrBalance();

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @param usdc_ Arc USDC ERC-20 (6 decimals). Native gas is a separate 18-dec view of the same pool — do not double-count.
    /// @param initialOwner Till owner (can pause, fund, withdraw, set policy).
    /// @param initialPolicy Spending policy applied on every agent payment.
    constructor(address usdc_, address initialOwner, Policy memory initialPolicy) Ownable(initialOwner) {
        if (usdc_ == address(0) || initialOwner == address(0)) revert ZeroAddress();
        usdc = IERC20(usdc_);
        policy = initialPolicy;
        currentDay = block.timestamp / 1 days;
        emit PolicyUpdated(
            initialPolicy.maxPerPayment,
            initialPolicy.dailyCap,
            initialPolicy.sessionCap,
            initialPolicy.allowlistEnabled,
            initialPolicy.memoRequired
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Funding (owner)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Deposit USDC into the till budget. Caller must approve this contract first.
    function fund(uint256 amount) external onlyOwner nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        budget += amount;
        emit TillFunded(msg.sender, amount, budget);
    }

    /// @notice Withdraw unused USDC back to owner (or `to`).
    function withdraw(uint256 amount, address to) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (to == address(0)) revert ZeroAddress();
        if (amount > budget) revert InsufficientBudget();
        budget -= amount;
        usdc.safeTransfer(to, amount);
        emit TillWithdrawn(to, amount, budget);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Agents
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Bind an agent address that may spend within policy.
    function registerAgent(address agent, string calldata name) external onlyOwner {
        if (agent == address(0)) revert ZeroAddress();
        if (agents[agent].registered) revert AgentAlreadyRegistered();
        agents[agent] = AgentInfo({registered: true, name: name, spent: 0});
        _agentList.push(agent);
        emit AgentRegistered(agent, name);
    }

    /// @notice Revoke an agent's spending rights.
    function revokeAgent(address agent) external onlyOwner {
        if (!agents[agent].registered) revert NotAgent();
        agents[agent].registered = false;
        emit AgentRevoked(agent);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Policy / allowlist (owner)
    // ─────────────────────────────────────────────────────────────────────────

    function updatePolicy(Policy calldata newPolicy) external onlyOwner {
        policy = newPolicy;
        emit PolicyUpdated(
            newPolicy.maxPerPayment,
            newPolicy.dailyCap,
            newPolicy.sessionCap,
            newPolicy.allowlistEnabled,
            newPolicy.memoRequired
        );
    }

    function setAllowlist(address payee, bool allowed) external onlyOwner {
        if (payee == address(0)) revert ZeroAddress();
        if (allowed && !allowlist[payee]) {
            _allowlistKeys.push(payee);
        }
        allowlist[payee] = allowed;
        emit AllowlistUpdated(payee, allowed);
    }

    function setAllowlistBatch(address[] calldata payees, bool allowed) external onlyOwner {
        for (uint256 i = 0; i < payees.length; i++) {
            address payee = payees[i];
            if (payee == address(0)) revert ZeroAddress();
            if (allowed && !allowlist[payee]) {
                _allowlistKeys.push(payee);
            }
            allowlist[payee] = allowed;
            emit AllowlistUpdated(payee, allowed);
        }
    }

    function pause() external onlyOwner {
        _pause();
        emit TillPaused(msg.sender);
    }

    function unpause() external onlyOwner {
        _unpause();
        emit TillUnpaused(msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Spend (agent)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Agent executes a policy-checked USDC payment to `payee`.
    /// @param amount USDC amount (6 decimals).
    /// @param payee Recipient address.
    /// @param reason Human-readable memo / grant reason.
    function spend(uint256 amount, address payee, string calldata reason)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 paymentId)
    {
        AgentInfo storage agent = agents[msg.sender];
        if (!agent.registered) revert NotAgent();
        if (amount == 0) revert ZeroAmount();
        if (payee == address(0)) revert ZeroAddress();
        if (policy.memoRequired && bytes(reason).length == 0) revert MemoRequired();
        if (policy.allowlistEnabled && !allowlist[payee]) revert PayeeNotAllowed();
        if (policy.maxPerPayment != 0 && amount > policy.maxPerPayment) revert ExceedsMaxPerPayment();
        if (amount > budget) revert InsufficientBudget();

        _rolloverDay();

        if (policy.dailyCap != 0 && dailySpent + amount > policy.dailyCap) revert ExceedsDailyCap();
        if (policy.sessionCap != 0 && sessionSpent + amount > policy.sessionCap) {
            revert ExceedsSessionCap();
        }

        budget -= amount;
        sessionSpent += amount;
        dailySpent += amount;
        agent.spent += amount;

        paymentId = ++paymentCount;

        usdc.safeTransfer(payee, amount);

        emit PaymentExecuted(paymentId, msg.sender, payee, amount, reason, budget);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────────────────

    function getPolicy() external view returns (Policy memory) {
        return policy;
    }

    function getAgent(address agent) external view returns (AgentInfo memory) {
        return agents[agent];
    }

    function getAgents() external view returns (address[] memory) {
        return _agentList;
    }

    function remainingBudget() external view returns (uint256) {
        return budget;
    }

    function isPayeeAllowed(address payee) external view returns (bool) {
        if (!policy.allowlistEnabled) return true;
        return allowlist[payee];
    }

    function contractUsdcBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internals
    // ─────────────────────────────────────────────────────────────────────────

    function _rolloverDay() internal {
        uint256 day = block.timestamp / 1 days;
        if (day != currentDay) {
            currentDay = day;
            dailySpent = 0;
        }
    }
}
