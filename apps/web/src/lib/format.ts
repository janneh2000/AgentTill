import { formatUnits, parseUnits } from "viem";
import { USDC_DECIMALS } from "@/config/chains";

/** Format USDC (6 decimals) for display. */
export function formatUsdc(amount: bigint | number | string, digits = 2): string {
  const n =
    typeof amount === "bigint"
      ? Number(formatUnits(amount, USDC_DECIMALS))
      : typeof amount === "string"
        ? Number(amount)
        : amount;
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function parseUsdc(input: string): bigint {
  const cleaned = input.trim().replace(/,/g, "");
  if (!cleaned) return 0n;
  return parseUnits(cleaned, USDC_DECIMALS);
}

export function shortAddress(addr: string, size = 4): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`;
}

export function formatUsdFee(label = "~$0.01"): string {
  return label;
}
