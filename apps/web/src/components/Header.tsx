"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useAppState } from "@/components/AppState";
import { arcMainnet, arcTestnet, TYPICAL_FEE_USD } from "@/config/chains";
import { shortAddress } from "@/lib/format";

export function Header() {
  const { network, setNetwork, demo } = useAppState();
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const targetChain = network === "mainnet" ? arcMainnet : arcTestnet;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-arc-400 to-arc-700 text-sm font-bold text-white shadow-glow">
              AT
            </span>
            <span className="hidden sm:inline">AgentTill</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm text-slate-400 md:flex">
            <Link href="/dashboard" className="rounded-md px-3 py-1.5 hover:bg-white/5 hover:text-white">
              Dashboard
            </Link>
            <Link href="/dashboard#ledger" className="rounded-md px-3 py-1.5 hover:bg-white/5 hover:text-white">
              Ledger
            </Link>
            <a
              href="https://docs.arc.io"
              target="_blank"
              rel="noreferrer"
              className="rounded-md px-3 py-1.5 hover:bg-white/5 hover:text-white"
            >
              Arc Docs
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {demo && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
              Demo mode
            </span>
          )}
          <div className="flex rounded-lg border border-white/10 bg-ink-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setNetwork("testnet");
                switchChain?.({ chainId: arcTestnet.id });
              }}
              className={`rounded-md px-2.5 py-1.5 transition ${
                network === "testnet" ? "bg-arc-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Testnet
            </button>
            <button
              type="button"
              onClick={() => {
                setNetwork("mainnet");
                switchChain?.({ chainId: arcMainnet.id });
              }}
              className={`rounded-md px-2.5 py-1.5 transition ${
                network === "mainnet" ? "bg-arc-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Mainnet
            </button>
          </div>

          {isConnected && address ? (
            <div className="flex items-center gap-2">
              {chain && chain.id !== targetChain.id && (
                <button
                  type="button"
                  onClick={() => switchChain?.({ chainId: targetChain.id })}
                  className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300"
                >
                  Switch to Arc
                </button>
              )}
              <button
                type="button"
                onClick={() => disconnect()}
                className="rounded-lg border border-white/10 bg-ink-800 px-3 py-1.5 font-mono text-xs text-slate-200 hover:bg-ink-700"
                title={`Fees typically ${TYPICAL_FEE_USD} on Arc`}
              >
                {shortAddress(address)}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const c = connectors.find((x) => x.id === "injected") ?? connectors[0];
                if (c) connect({ connector: c, chainId: targetChain.id });
              }}
              className="rounded-lg bg-arc-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-arc-500 disabled:opacity-50"
            >
              {isPending ? "Connecting…" : "Connect wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
