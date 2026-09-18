// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentTill} from "../src/AgentTill.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {AgentTillFactory} from "../src/AgentTillFactory.sol";

contract AgentTillTest is Test {
    MockUSDC internal usdc;
    AgentTill internal till;

    address internal owner = makeAddr("owner");
    address internal agent = makeAddr("agent");
    address internal payee = makeAddr("payee");
    address internal stranger = makeAddr("stranger");
    address internal payee2 = makeAddr("payee2");

    uint256 internal constant ONE = 1e6; // 1 USDC (6 decimals)

    function setUp() public {
        usdc = new MockUSDC();
        AgentTill.Policy memory policy = AgentTill.Policy({
            maxPerPayment: 100 * ONE,
            dailyCap: 500 * ONE,
            sessionCap: 1000 * ONE,
            allowlistEnabled: true,
            memoRequired: true
        });
        till = new AgentTill(address(usdc), owner, policy);

        usdc.mint(owner, 10_000 * ONE);
        vm.startPrank(owner);
        usdc.approve(address(till), type(uint256).max);
        till.fund(2000 * ONE);
        till.setAllowlist(payee, true);
        till.registerAgent(agent, "GrantBot");
        vm.stopPrank();
    }

    // ─── Happy path ──────────────────────────────────────────────────────────

    function test_FundIncreasesBudget() public view {
        assertEq(till.budget(), 2000 * ONE);
        assertEq(usdc.balanceOf(address(till)), 2000 * ONE);
    }

    function test_AgentSpendSucceeds() public {
        vm.prank(agent);
        uint256 id = till.spend(50 * ONE, payee, "Circle Arc microgrant #1");
        assertEq(id, 1);
        assertEq(till.budget(), 1950 * ONE);
        assertEq(usdc.balanceOf(payee), 50 * ONE);
        assertEq(till.getAgent(agent).spent, 50 * ONE);
    }

    function test_OwnerWithdraw() public {
        uint256 before = usdc.balanceOf(owner);
        vm.prank(owner);
        till.withdraw(100 * ONE, owner);
        assertEq(till.budget(), 1900 * ONE);
        assertEq(usdc.balanceOf(owner), before + 100 * ONE);
    }

    function test_FactoryCreatesTill() public {
        AgentTillFactory factory = new AgentTillFactory(address(usdc));
        AgentTill.Policy memory policy = AgentTill.Policy({
            maxPerPayment: 10 * ONE,
            dailyCap: 0,
            sessionCap: 0,
            allowlistEnabled: false,
            memoRequired: false
        });
        address created = factory.createTill(owner, policy);
        assertTrue(created != address(0));
        assertEq(AgentTill(created).owner(), owner);
    }

    // ─── Policy enforcement ──────────────────────────────────────────────────

    function test_RevertWhen_NotAgent() public {
        vm.prank(stranger);
        vm.expectRevert(AgentTill.NotAgent.selector);
        till.spend(1 * ONE, payee, "nope");
    }

    function test_RevertWhen_ExceedsMaxPerPayment() public {
        vm.prank(agent);
        vm.expectRevert(AgentTill.ExceedsMaxPerPayment.selector);
        till.spend(101 * ONE, payee, "too big");
    }

    function test_RevertWhen_InsufficientBudget() public {
        vm.startPrank(owner);
        till.updatePolicy(
            AgentTill.Policy({
                maxPerPayment: 0,
                dailyCap: 0,
                sessionCap: 0,
                allowlistEnabled: true,
                memoRequired: true
            })
        );
        vm.stopPrank();

        vm.prank(agent);
        vm.expectRevert(AgentTill.InsufficientBudget.selector);
        till.spend(2001 * ONE, payee, "drain");
    }

    function test_RevertWhen_PayeeNotAllowed() public {
        vm.prank(agent);
        vm.expectRevert(AgentTill.PayeeNotAllowed.selector);
        till.spend(10 * ONE, payee2, "bad payee");
    }

    function test_RevertWhen_MemoRequired() public {
        vm.prank(agent);
        vm.expectRevert(AgentTill.MemoRequired.selector);
        till.spend(10 * ONE, payee, "");
    }

    function test_RevertWhen_ExceedsDailyCap() public {
        // dailyCap = 500; spend 100 five times, then fail
        vm.startPrank(agent);
        for (uint256 i = 0; i < 5; i++) {
            till.spend(100 * ONE, payee, "day chunk");
        }
        vm.expectRevert(AgentTill.ExceedsDailyCap.selector);
        till.spend(1 * ONE, payee, "over daily");
        vm.stopPrank();
    }

    function test_DailyCapResetsNextDay() public {
        vm.startPrank(agent);
        for (uint256 i = 0; i < 5; i++) {
            till.spend(100 * ONE, payee, "fill daily");
        }
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(agent);
        till.spend(100 * ONE, payee, "next day ok");
        assertEq(usdc.balanceOf(payee), 600 * ONE);
    }

    function test_RevertWhen_ExceedsSessionCap() public {
        vm.startPrank(owner);
        till.updatePolicy(
            AgentTill.Policy({
                maxPerPayment: 0,
                dailyCap: 0,
                sessionCap: 100 * ONE,
                allowlistEnabled: true,
                memoRequired: false
            })
        );
        vm.stopPrank();

        vm.startPrank(agent);
        till.spend(100 * ONE, payee, "session fill");
        vm.expectRevert(AgentTill.ExceedsSessionCap.selector);
        till.spend(1 * ONE, payee, "over session");
        vm.stopPrank();
    }

    function test_OpenAllowlistAllowsAnyPayee() public {
        vm.prank(owner);
        till.updatePolicy(
            AgentTill.Policy({
                maxPerPayment: 100 * ONE,
                dailyCap: 500 * ONE,
                sessionCap: 1000 * ONE,
                allowlistEnabled: false,
                memoRequired: true
            })
        );

        vm.prank(agent);
        till.spend(25 * ONE, payee2, "open payee");
        assertEq(usdc.balanceOf(payee2), 25 * ONE);
    }

    // ─── Pause ───────────────────────────────────────────────────────────────

    function test_PauseBlocksSpendAndFund() public {
        vm.prank(owner);
        till.pause();

        vm.prank(agent);
        vm.expectRevert();
        till.spend(1 * ONE, payee, "paused");

        vm.prank(owner);
        vm.expectRevert();
        till.fund(1 * ONE);
    }

    function test_UnpauseRestoresSpend() public {
        vm.startPrank(owner);
        till.pause();
        till.unpause();
        vm.stopPrank();

        vm.prank(agent);
        till.spend(10 * ONE, payee, "after unpause");
        assertEq(usdc.balanceOf(payee), 10 * ONE);
    }

    function test_WithdrawWorksWhilePaused() public {
        vm.startPrank(owner);
        till.pause();
        till.withdraw(50 * ONE, owner);
        vm.stopPrank();
        assertEq(till.budget(), 1950 * ONE);
    }

    // ─── Agent lifecycle ─────────────────────────────────────────────────────

    function test_RevokeAgentBlocksSpend() public {
        vm.prank(owner);
        till.revokeAgent(agent);

        vm.prank(agent);
        vm.expectRevert(AgentTill.NotAgent.selector);
        till.spend(1 * ONE, payee, "revoked");
    }

    function test_CannotRegisterTwice() public {
        vm.prank(owner);
        vm.expectRevert(AgentTill.AgentAlreadyRegistered.selector);
        till.registerAgent(agent, "dup");
    }

    function test_AllowlistBatch() public {
        address[] memory payees = new address[](2);
        payees[0] = payee2;
        payees[1] = stranger;
        vm.prank(owner);
        till.setAllowlistBatch(payees, true);
        assertTrue(till.allowlist(payee2));
        assertTrue(till.allowlist(stranger));
    }
}
