"use client";

import { useEffect, useRef, useState } from "react";
import { isAddress } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useAppState } from "@/components/AppState";
import { agentTillAbi, erc20Abi } from "@/abi/AgentTill";
import { getUsdcAddress } from "@/config/env";
import { explorerTxUrl } from "@/config/chains";
import { parseUsdc } from "@/lib/format";

type PendingAction =
  | { kind: "pause" }
  | { kind: "unpause" }
  | { kind: "approve"; amountWei: bigint }
  | { kind: "fund"; amountWei: bigint }
  | { kind: "withdraw"; amountWei: bigint; to: `0x${string}` }
  | { kind: "register"; agent: `0x${string}`; name: string }
  | null;

export function OwnerControls() {
  const {
    demo,
    demoState,
    runDemoFund,
    runDemoPause,
    runDemoRegister,
    network,
    tillAddress,
  } = useAppState();
  const { address, isConnected } = useAccount();
  const [topUp, setTopUp] = useState("100");
  const [withdrawAmt, setWithdrawAmt] = useState("10");
  const [agentAddr, setAgentAddr] = useState(
    "0xAgent00000000000000000000000000000000002",
  );
  const [agentName, setAgentName] = useState("ResearchAgent");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const handledHash = useRef<`0x${string}` | undefined>(undefined);
  const pendingRef = useRef<PendingAction>(null);
  pendingRef.current = pending;

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (writeError) {
      setError(writeError.message?.slice(0, 200) || "Transaction failed");
      setPending(null);
    }
  }, [writeError]);

  useEffect(() => {
    if (!isSuccess || !txHash || handledHash.current === txHash) return;
    handledHash.current = txHash;
    const action = pendingRef.current;
    if (!action || !tillAddress) return;

    if (action.kind === "approve") {
      const amountWei = action.amountWei;
      setPending({ kind: "fund", amountWei });
      setMsg("Approved — submitting fund…");
      writeContract({
        address: tillAddress,
        abi: agentTillAbi,
        functionName: "fund",
        args: [amountWei],
      });
      return;
    }

    const labels: Record<string, string> = {
      pause: "Till paused",
      unpause: "Till unpaused",
      fund: "Till funded",
      withdraw: "Withdrawn",
      register: "Agent registered",
    };
    setMsg(labels[action.kind] ?? "Done");
    setError(null);
    setPending(null);
  }, [isSuccess, txHash, tillAddress, writeContract]);

  const requireWallet = (): boolean => {
    if (!isConnected || !address) {
      setError("Connect a wallet first");
      return false;
    }
    if (!tillAddress) {
      setError("No till address configured");
      return false;
    }
    return true;
  };

  const startTx = (action: NonNullable<PendingAction>, fn: () => void) => {
    setError(null);
    setMsg(null);
    resetWrite();
    handledHash.current = undefined;
    setPending(action);
    fn();
  };

  if (demo) {
    return (
      <div className="rounded-2xl border border-white/5 bg-ink-900/80 p-5">
        <h2 className="text-sm font-semibold text-white">Owner controls</h2>
        <p className="mt-1 text-xs text-slate-500">
          Pause · top-up · register agents · policy (demo)
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              runDemoPause();
              setMsg(demoState.paused ? "Till unpaused" : "Till paused");
            }}
            className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-ink-700"
          >
            {demoState.paused ? "Unpause" : "Pause till"}
          </button>
          <div className="flex gap-2">
            <input
              value={topUp}
              onChange={(e) => setTopUp(e.target.value)}
              className="w-24 rounded-lg border border-white/10 bg-ink-950 px-2 py-2 font-mono text-xs text-white"
            />
            <button
              type="button"
              onClick={() => {
                const n = Number(topUp);
                if (n > 0) {
                  runDemoFund(n);
                  setMsg(`Topped up $${n.toFixed(2)} USDC`);
                }
              }}
              className="rounded-lg bg-emerald-600/90 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Top-up
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Agent name"
            className="rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-xs text-white"
          />
          <input
            value={agentAddr}
            onChange={(e) => setAgentAddr(e.target.value)}
            placeholder="0x…"
            className="rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-white"
          />
          <button
            type="button"
            onClick={() => {
              runDemoRegister(agentAddr, agentName);
              setMsg(`Registered ${agentName}`);
            }}
            className="rounded-lg bg-arc-600 px-3 py-2 text-xs font-semibold text-white hover:bg-arc-500"
          >
            Register
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-4">
          <div className="rounded-lg bg-ink-950/80 p-2">
            Max / pay
            <div className="font-mono text-slate-200">${demoState.maxPerPayment}</div>
          </div>
          <div className="rounded-lg bg-ink-950/80 p-2">
            Daily cap
            <div className="font-mono text-slate-200">${demoState.dailyCap}</div>
          </div>
          <div className="rounded-lg bg-ink-950/80 p-2">
            Session cap
            <div className="font-mono text-slate-200">${demoState.sessionCap}</div>
          </div>
          <div className="rounded-lg bg-ink-950/80 p-2">
            Memo
            <div className="text-slate-200">
              {demoState.memoRequired ? "Required" : "Optional"}
            </div>
          </div>
        </div>

        {msg ? <p className="mt-3 text-xs text-emerald-400">{msg}</p> : null}
      </div>
    );
  }

  const busy = isPending || confirming;
  const usdc = getUsdcAddress();

  return (
    <div className="rounded-2xl border border-white/5 bg-ink-900/80 p-5">
      <h2 className="text-sm font-semibold text-white">Owner controls</h2>
      <p className="mt-1 text-xs text-slate-500">
        Pause · fund (approve + fund) · withdraw · register — onchain
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!requireWallet() || !tillAddress) return;
            startTx({ kind: "pause" }, () =>
              writeContract({
                address: tillAddress,
                abi: agentTillAbi,
                functionName: "pause",
              }),
            );
          }}
          className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-ink-700 disabled:opacity-40"
        >
          Pause till
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!requireWallet() || !tillAddress) return;
            startTx({ kind: "unpause" }, () =>
              writeContract({
                address: tillAddress,
                abi: agentTillAbi,
                functionName: "unpause",
              }),
            );
          }}
          className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-ink-700 disabled:opacity-40"
        >
          Unpause
        </button>
        <div className="flex gap-2">
          <input
            value={topUp}
            onChange={(e) => setTopUp(e.target.value)}
            className="w-24 rounded-lg border border-white/10 bg-ink-950 px-2 py-2 font-mono text-xs text-white"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!requireWallet() || !tillAddress) return;
              const amountWei = parseUsdc(topUp);
              if (amountWei <= 0n) {
                setError("Enter a valid top-up amount");
                return;
              }
              startTx({ kind: "approve", amountWei }, () =>
                writeContract({
                  address: usdc,
                  abi: erc20Abi,
                  functionName: "approve",
                  args: [tillAddress, amountWei],
                }),
              );
            }}
            className="rounded-lg bg-emerald-600/90 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            Top-up
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={withdrawAmt}
          onChange={(e) => setWithdrawAmt(e.target.value)}
          className="w-24 rounded-lg border border-white/10 bg-ink-950 px-2 py-2 font-mono text-xs text-white"
          placeholder="Withdraw"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!requireWallet() || !tillAddress || !address) return;
            const amountWei = parseUsdc(withdrawAmt);
            if (amountWei <= 0n) {
              setError("Enter a valid withdraw amount");
              return;
            }
            startTx({ kind: "withdraw", amountWei, to: address }, () =>
              writeContract({
                address: tillAddress,
                abi: agentTillAbi,
                functionName: "withdraw",
                args: [amountWei, address],
              }),
            );
          }}
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-40"
        >
          Withdraw
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Agent name"
          className="rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-xs text-white"
        />
        <input
          value={agentAddr}
          onChange={(e) => setAgentAddr(e.target.value)}
          placeholder="0x…"
          className="rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-white"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!requireWallet() || !tillAddress) return;
            if (!isAddress(agentAddr)) {
              setError("Enter a valid agent address");
              return;
            }
            const agent = agentAddr as `0x${string}`;
            startTx({ kind: "register", agent, name: agentName }, () =>
              writeContract({
                address: tillAddress,
                abi: agentTillAbi,
                functionName: "registerAgent",
                args: [agent, agentName],
              }),
            );
          }}
          className="rounded-lg bg-arc-600 px-3 py-2 text-xs font-semibold text-white hover:bg-arc-500 disabled:opacity-40"
        >
          Register
        </button>
      </div>

      {error ? <p className="mt-3 text-xs text-rose-400">{error}</p> : null}
      {msg ? <p className="mt-3 text-xs text-emerald-400">{msg}</p> : null}
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
      {busy ? (
        <p className="mt-2 text-xs text-slate-500">
          {pending?.kind === "approve"
            ? "Waiting for USDC approve…"
            : pending?.kind === "fund"
              ? "Waiting for fund…"
              : "Waiting for wallet / confirmation…"}
        </p>
      ) : null}
    </div>
  );
}
