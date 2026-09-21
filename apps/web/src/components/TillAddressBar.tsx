"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/components/AppState";
import { getEnvTillAddress } from "@/config/env";
import { shortAddress } from "@/lib/format";

export function TillAddressBar() {
  const { tillAddress, setTillAddressOverride, demo } = useAppState();
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const envTill = getEnvTillAddress();

  useEffect(() => {
    setDraft(tillAddress ?? "");
  }, [tillAddress]);

  return (
    <div className="rounded-2xl border border-white/5 bg-ink-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Till address
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Paste to override at runtime (saved in localStorage). Clear to fall back to{" "}
            {envTill ? (
              <span className="font-mono text-slate-400">{shortAddress(envTill)}</span>
            ) : (
              "env / demo"
            )}
            .
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            demo
              ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {demo ? "Demo mode" : "Onchain"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="0x… AgentTill address"
          className="min-w-[16rem] flex-1 rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-white outline-none focus:border-arc-500"
        />
        <button
          type="button"
          onClick={() => {
            const err = setTillAddressOverride(draft);
            setHint(err ?? `Using ${draft.slice(0, 10)}…`);
          }}
          className="rounded-lg bg-arc-600 px-3 py-2 text-xs font-semibold text-white hover:bg-arc-500"
        >
          Use address
        </button>
        <button
          type="button"
          onClick={() => {
            setTillAddressOverride(null);
            setDraft(envTill ?? "");
            setHint(envTill ? "Cleared override — using env" : "Cleared — demo mode");
          }}
          className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-ink-700"
        >
          Clear override
        </button>
      </div>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
