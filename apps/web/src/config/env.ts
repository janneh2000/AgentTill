/** Public env — no secrets. WalletConnect project id is a public client id. */

export function getWalletConnectProjectId(): string {
  return process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";
}

export function getTillAddress(): `0x${string}` | undefined {
  const v = process.env.NEXT_PUBLIC_AGENT_TILL_ADDRESS;
  if (!v || !v.startsWith("0x") || v.length !== 42) return undefined;
  return v as `0x${string}`;
}

export function getUsdcAddress(): `0x${string}` {
  const v = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  if (v && v.startsWith("0x") && v.length === 42) return v as `0x${string}`;
  return "0x3600000000000000000000000000000000000000";
}

export function isDemoMode(): boolean {
  return !getTillAddress();
}

export function defaultNetwork(): "testnet" | "mainnet" {
  const n = process.env.NEXT_PUBLIC_DEFAULT_NETWORK;
  return n === "mainnet" ? "mainnet" : "testnet";
}
