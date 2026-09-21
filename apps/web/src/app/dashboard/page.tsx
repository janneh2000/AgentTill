"use client";

import { useAppState } from "@/components/AppState";
import { StatCard } from "@/components/StatCard";
import { AgentCard } from "@/components/AgentCard";
import { Ledger } from "@/components/Ledger";
import { SpendConsole } from "@/components/SpendConsole";
import { OwnerControls } from "@/components/OwnerControls";
import { TillAddressBar } from "@/components/TillAddressBar";
import { TYPICAL_FEE_USD } from "@/config/chains";

export default function DashboardPage() {
  const { network, demo, demoState, tillAddress } = useAppState();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Till dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            {demo
              ? "Demo / mock mode — set NEXT_PUBLIC_AGENT_TILL_ADDRESS or paste a till below."
              : `Onchain till ${tillAddress}`}
            {" · "}
            Network: {network === "mainnet" ? "Arc Mainnet (5042)" : "Arc Testnet (5042002)"}
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-slate-400">
          Typical Arc fee {TYPICAL_FEE_USD}
        </div>
      </div>

      <div className="mb-6">
        <TillAddressBar />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Remaining budget"
          value={`$${demoState.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          hint="USDC ERC-20 (6 decimals)"
          accent="blue"
        />
        <StatCard
          label="Session spent"
          value={`$${demoState.sessionSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          hint={demoState.sessionCap ? `Cap $${demoState.sessionCap}` : "No session cap"}
          accent="green"
        />
        <StatCard
          label="Agents"
          value={String(demoState.agents.filter((a) => a.registered).length)}
          hint="Registered spenders"
        />
        <StatCard
          label="Status"
          value={demoState.paused ? "Paused" : "Active"}
          hint={`Payments #${demoState.payments.length}`}
          accent={demoState.paused ? "rose" : "green"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SpendConsole />
        <OwnerControls />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Agents
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demoState.agents
            .filter((a) => a.registered)
            .map((a) => (
              <AgentCard
                key={a.address}
                name={a.name}
                address={a.address}
                spent={a.spent}
                remainingHint={`Max $${demoState.maxPerPayment}/pay`}
              />
            ))}
        </div>
      </section>

      <section className="mt-8">
        <Ledger payments={demoState.payments} network={network} />
      </section>
    </div>
  );
}
