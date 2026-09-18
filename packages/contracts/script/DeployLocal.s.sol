// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentTill} from "../src/AgentTill.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// @notice Local Anvil deploy with MockUSDC for demos.
contract DeployLocal is Script {
    function run() external {
        uint256 pk = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address owner = vm.addr(pk);

        vm.startBroadcast(pk);

        MockUSDC usdc = new MockUSDC();
        usdc.mint(owner, 1_000_000 * 1e6);

        AgentTill.Policy memory policy = AgentTill.Policy({
            maxPerPayment: 100 * 1e6,
            dailyCap: 500 * 1e6,
            sessionCap: 5_000 * 1e6,
            allowlistEnabled: false,
            memoRequired: true
        });

        AgentTill till = new AgentTill(address(usdc), owner, policy);
        usdc.approve(address(till), type(uint256).max);
        till.fund(10_000 * 1e6);

        console2.log("MockUSDC:", address(usdc));
        console2.log("AgentTill:", address(till));
        console2.log("Owner:", owner);

        vm.stopBroadcast();
    }
}
