import { defineChain, type Chain } from "viem";

/**
 * Circle Arc L1 — authoritative config for AgentTill.
 * Prefer `import { arc, arcTestnet } from "viem/chains"` when available;
 * we defineChain with the same IDs/RPCs so builds stay lean and match docs.arc.io.
 */

export const ARC_USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;
export const USDC_DECIMALS = 6;

/** Native gas is the same USDC pool at 18 decimals — UI shows ONE ERC-20 USDC balance. */
export const NATIVE_USDC_DECIMALS = 18;

/** Arc mainnet — chain 5042 (aligns with viem/chains `arc`). */
export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.arc.io"] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.arc.io" },
  },
});

/** Arc testnet — chain 5042002 (aligns with viem/chains `arcTestnet`). */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.io"] },
  },
  blockExplorers: {
    default: {
      name: "Arc Testnet Explorer",
      url: "https://explorer.testnet.arc.io",
    },
  },
});

// Re-export under viem-familiar names for consumers that expect them
export { arcMainnet as arc };

export const supportedChains = [arcTestnet, arcMainnet] as const;

export type NetworkId = "testnet" | "mainnet";

export function chainForNetwork(network: NetworkId): Chain {
  return network === "mainnet" ? arcMainnet : arcTestnet;
}

export function explorerTxUrl(network: NetworkId, hash: string): string {
  const base =
    network === "mainnet"
      ? "https://explorer.arc.io"
      : "https://explorer.testnet.arc.io";
  return `${base}/tx/${hash}`;
}

export function explorerAddressUrl(network: NetworkId, address: string): string {
  const base =
    network === "mainnet"
      ? "https://explorer.arc.io"
      : "https://explorer.testnet.arc.io";
  return `${base}/address/${address}`;
}

/** Approximate Arc fee display — never show Gwei/ETH. */
export const TYPICAL_FEE_USD = "~$0.01";
