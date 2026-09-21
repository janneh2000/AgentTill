"use client";

import { useEffect, useState } from "react";
import { isAddress } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useAppState } from "@/components/AppState";
import { agentTillAbi } from "@/abi/AgentTill";
import { explorerTxUrl, TYPICAL_FEE_USD } from "@/config/chains";
import { parseUsdc } from "@/lib/format";

export function SpendConsole() {
  const { demo, demoState, runDemoSpend, network, tillAddress } = useAppState();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("25");
  const [payee, setPayee] = useState("0xPayee0000000000000000000000000000000004");
  const [reason, setReason] = useState("Circle Arc Microgrant — builder stipend");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess, error: receiptError } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (writeError) {
      setError(writeError.message?.slice(0, 200) || "Transaction failed");
      setOk(null);
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      setError(receiptError.message?.slice(0, 200) || "Confirmation failed");
      setOk(null);
    }
  }, [receiptError]);

  useEffect(() => {
    if (isSuccess && txHash) {
      const n = Number(amount);
      setOk(
        `Paid $${Number.isFinite(n) ? n.toFixed(2) : amount} USDC · fee ${TYPICAL_FEE_USD}`,
      );
      setError(null);
    }
  }, [isSuccess, txHash, amount]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    resetWrite();

    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a valid USDC amount");
      return;
    }

    if (demo) {
      const err = runDemoSpend(n, payee, reason);
      if (err) setError(err);
      else setOk(`Paid $${n.toFixed(2)} USDC · fee ${TYPICAL_FEE_USD}`);
      return;
    }

    if (!tillAddress) {
      setError("Set a till address (env or paste below) to spend onchain.");
      return;
    }
    if (!isConnected || !address) {
      setError("Connect a wallet to execute onchain spend.");
      return;
    }
    if (!isAddress(payee)) {
      setError("Enter a valid payee address");
      return;
    }

    const amountWei = parseUsdc(amount);
    writeContract({
      address: tillAddress,
      abi: agentTillAbi,
      functionName: "spend",
      args: [amountWei, payee as `0x${string}`, reason],
    });
  };

  const busy = isPending || confirming;
  const paused = demo ? demoState.paused : false;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/5 bg-ink-900/80 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Agent spend console</h2>
        <span className="text-xs text-slate-500">
          {demo
            ? `Budget $${demoState.budget.toFixed(2)} · ${demoState.paused ? "Paused" : "Live"}`
            : tillAddress
              ? `Onchain · ${tillAddress.slice(0, 6)}…${tillAddress.slice(-4)}`
              : "No till"}
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
        Reason / memo {demo && demoState.memoRequired ? "(required)" : ""}
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:border-arc-500"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm text-emerald-400">{ok}</p> : null}
      {txHash ? (
        <p className="mt-2 text-xs text-slate-400">
          Tx:{" "}
          <a
            href={explorerTxUrl(network, txHash)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-arc-300 hover:underline"
          >
            {txHash.slice(0, 10)}…{txHash.slice(-8)}
          </a>
          {confirming ? " · confirming…" : isSuccess ? " · confirmed" : ""}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={paused || busy}
        className="mt-4 w-full rounded-lg bg-arc-600 py-2.5 text-sm font-semibold text-white hover:bg-arc-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? (confirming ? "Confirming…" : "Submitting…") : "Execute payment"}
      </button>
    </form>
  );
}
