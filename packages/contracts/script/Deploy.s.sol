// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentTill} from "../src/AgentTill.sol";
import {AgentTillFactory} from "../src/AgentTillFactory.sol";

/// @notice Deploy AgentTill (+ optional factory) to Arc testnet or mainnet.
/// @dev Arc USDC ERC-20 (6 decimals): 0x3600000000000000000000000000000000000000
///      Usage:
///        forge script script/Deploy.s.sol:Deploy --rpc-url $ARC_TESTNET_RPC_URL --broadcast
///        forge script script/Deploy.s.sol:Deploy --rpc-url $ARC_MAINNET_RPC_URL --broadcast
contract Deploy is Script {
    address constant ARC_USDC = 0x3600000000000000000000000000000000000000;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(pk);

        // Defaults suitable for Circle Arc microgrants demo
        AgentTill.Policy memory policy = AgentTill.Policy({
            maxPerPayment: 100 * 1e6, // 100 USDC
            dailyCap: 500 * 1e6, // 500 USDC / day
            sessionCap: 5_000 * 1e6, // 5,000 USDC session
            allowlistEnabled: false,
            memoRequired: true
        });

        bool deployFactory = vm.envOr("DEPLOY_FACTORY", false);

        vm.startBroadcast(pk);

        AgentTill till = new AgentTill(ARC_USDC, owner, policy);
        console2.log("AgentTill deployed:", address(till));
        console2.log("Owner:", owner);
        console2.log("USDC:", ARC_USDC);

        if (deployFactory) {
            AgentTillFactory factory = new AgentTillFactory(ARC_USDC);
            console2.log("AgentTillFactory:", address(factory));
        }

        vm.stopBroadcast();
    }
}
