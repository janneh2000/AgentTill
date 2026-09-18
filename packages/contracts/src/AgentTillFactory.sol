// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AgentTill} from "./AgentTill.sol";

/// @title AgentTillFactory
/// @notice Deploys policy-bound AgentTill instances for Circle Arc microgrants.
contract AgentTillFactory {
    address public immutable usdc;

    event TillCreated(address indexed till, address indexed owner, address indexed creator);

    constructor(address usdc_) {
        require(usdc_ != address(0), "Factory: zero USDC");
        usdc = usdc_;
    }

    /// @notice Create a new AgentTill owned by `owner` with the given policy.
    function createTill(address owner, AgentTill.Policy calldata policy)
        external
        returns (address till)
    {
        AgentTill deployed = new AgentTill(usdc, owner, policy);
        till = address(deployed);
        emit TillCreated(till, owner, msg.sender);
    }
}
