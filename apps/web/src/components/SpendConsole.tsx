"use client";

import { useState } from "react";
import { useAppState } from "@/components/AppState";
import { TYPICAL_FEE_USD } from "@/config/chains";

export function SpendConsole() {
  const { demo, demoState, runDemoSpend } = useAppState();
  const [amount, setAmount] = useState("25");
  const [payee, setPayee] = useState("0xPayee0000000000000000000000000000000004");
  const [reason, setReason] = useState("Circle Arc Microgrant — builder stipend");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (!demo) {
      setError("Connect a deployed till address to spend onchain. Demo mode is active when unset.");
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a valid USDC amount");
      return;
    }
    const err = runDemoSpend(n, payee, reason);
    if (err) setError(err);
    else setOk(`Paid $${n.toFixed(2)} USDC · fee ${TYPICAL_FEE_USD}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/5 bg-ink-900/80 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Agent spend console</h2>
        <span className="text-xs text-slate-500">
          Budget ${demoState.budget.toFixed(2)} · {demoState.paused ? "Paused" : "Live"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          Amount (USDC)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-arc-500"
            placeholder="25.00"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Payee address
          <input
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-arc-500"
          />
        </label>
      </div>
      <label className="mt-3 block text-xs text-slate-400">
        Reason / memo {demoState.memoRequired ? "(required)" : ""}
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:border-arc-500"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm text-emerald-400">{ok}</p> : null}
      <button
        type="submit"
        disabled={demoState.paused}
        className="mt-4 w-full rounded-lg bg-arc-600 py-2.5 text-sm font-semibold text-white hover:bg-arc-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Execute payment
      </button>
    </form>
  );
}
