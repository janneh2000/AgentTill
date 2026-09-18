# Deploy AgentTill to Circle Arc

## Prerequisites

- [Foundry](https://book.getfoundry.sh/) (`forge`, `cast`)
- USDC for **gas** on Arc mainnet (native gas uses the same USDC pool at 18 decimals; app balances use ERC-20 USDC at 6 decimals — fund the ERC-20 for till escrow)
- A funded deployer key (testnet faucet / mainnet USDC)

## Networks

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Arc Mainnet | 5042 | https://rpc.mainnet.arc.io | https://explorer.arc.io |
| Arc Testnet | 5042002 | https://rpc.testnet.arc.io | https://explorer.testnet.arc.io |

**USDC ERC-20:** `0x3600000000000000000000000000000000000000` (6 decimals)

## Testnet

```bash
cd packages/contracts
export PRIVATE_KEY=0xYOUR_KEY
export ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.io

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --broadcast \
  -vvvv
```

Optional factory:

```bash
DEPLOY_FACTORY=true forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --broadcast
```

## Mainnet

Ensure the deployer holds enough **USDC for gas**, then:

```bash
export PRIVATE_KEY=0xYOUR_KEY
export ARC_MAINNET_RPC_URL=https://rpc.mainnet.arc.io

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_MAINNET_RPC_URL \
  --broadcast \
  -vvvv
```

## After deploy

1. Copy the printed `AgentTill` address into `apps/web/.env.local` as `NEXT_PUBLIC_AGENT_TILL_ADDRESS`.
2. Approve USDC → till, then call `fund(amount)` as owner.
3. `registerAgent(agent, name)` and optionally configure allowlist / policy.
4. Agents call `spend(amount, payee, reason)`.

## Local Anvil

```bash
anvil &
cd packages/contracts
forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://127.0.0.1:8545 --broadcast
```

## Verify

Use Arc explorer verification when an API key is available; bytecode is in `packages/contracts/out/`.
