// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice 6-decimal USDC mock for local Foundry tests and Anvil demos.
contract MockUSDC is ERC20 {
    uint8 private constant DECIMALS_ = 6;

    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return DECIMALS_;
    }

    /// @notice Mint USDC to `to` for testing (6 decimals).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
