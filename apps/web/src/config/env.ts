/** Public env — no secrets. WalletConnect project id is a public client id. */

export const TILL_ADDRESS_STORAGE_KEY = "agenttill.tillAddress";

function isValidAddress(v: string | undefined | null): v is `0x${string}` {
  return !!v && v.startsWith("0x") && v.length === 42;
}

export function getWalletConnectProjectId(): string {
  return process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";
}

/** Build-time / Cloudflare env till address only. */
export function getEnvTillAddress(): `0x${string}` | undefined {
  const v = process.env.NEXT_PUBLIC_AGENT_TILL_ADDRESS;
  if (!isValidAddress(v)) return undefined;
  return v;
}

/** Client-only localStorage override (runtime paste). */
export function readStoredTillAddress(): `0x${string}` | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const v = window.localStorage.getItem(TILL_ADDRESS_STORAGE_KEY);
    if (!isValidAddress(v)) return undefined;
    return v;
  } catch {
    return undefined;
  }
}

export function writeStoredTillAddress(addr: `0x${string}` | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!addr) window.localStorage.removeItem(TILL_ADDRESS_STORAGE_KEY);
    else window.localStorage.setItem(TILL_ADDRESS_STORAGE_KEY, addr);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Effective till address: optional runtime override → localStorage → env.
 * Pass `override` from AppState when available so React re-renders stay in sync.
 */
export function getTillAddress(
  override?: `0x${string}` | null,
): `0x${string}` | undefined {
  if (isValidAddress(override ?? undefined)) return override as `0x${string}`;
  return readStoredTillAddress() ?? getEnvTillAddress();
}

export function getUsdcAddress(): `0x${string}` {
  const v = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  if (isValidAddress(v)) return v;
  return "0x3600000000000000000000000000000000000000";
}

export function isDemoMode(till?: `0x${string}` | null): boolean {
  return !getTillAddress(till);
}

export function defaultNetwork(): "testnet" | "mainnet" {
  const n = process.env.NEXT_PUBLIC_DEFAULT_NETWORK;
  return n === "mainnet" ? "mainnet" : "testnet";
}
