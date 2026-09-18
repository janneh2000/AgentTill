"use client";

import { useState } from "react";
import { useAppState } from "@/components/AppState";

export function OwnerControls() {
  const { demo, demoState, runDemoFund, runDemoPause, runDemoRegister } = useAppState();
  const [topUp, setTopUp] = useState("100");
  const [agentAddr, setAgentAddr] = useState("0xAgent00000000000000000000000000000000002");
  const [agentName, setAgentName] = useState("ResearchAgent");
  const [msg, setMsg] = useState<string | null>(null);

  if (!demo) {
    return (
      <div className="rounded-2xl border border-white/5 bg-ink-900/80 p-5 text-sm text-slate-400">
        Owner controls (pause, top-up, withdraw, allowlist) bind to the onchain till when{" "}
        <code className="text-arc-300">NEXT_PUBLIC_AGENT_TILL_ADDRESS</code> is set.
      </div>
    );
  }

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
          <div className="text-slate-200">{demoState.memoRequired ? "Required" : "Optional"}</div>
        </div>
      </div>

      {msg ? <p className="mt-3 text-xs text-emerald-400">{msg}</p> : null}
    </div>
  );
}
