import Link from "next/link";
import { TYPICAL_FEE_USD } from "@/config/chains";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-16">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-ink-900/40 px-6 py-14 shadow-glow sm:px-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-arc-500/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-arc-400">
          Circle Arc Microgrants
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Policy-bound agentic USDC till on Arc
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
          AgentTill is a micropayment desk: deposit a USDC budget, bind spending agents, and let
          them pay grantees — with onchain caps, allowlists, memos, and pause controls. Built for
          Arc so every fee is dollar-native (typically {TYPICAL_FEE_USD}), not gas theater.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-arc-600 px-5 py-3 text-sm font-semibold text-white hover:bg-arc-500"
          >
            Open dashboard
          </Link>
          <a
            href="https://docs.arc.io"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Why Arc →
          </a>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              t: "Create Till",
              d: "Escrow USDC with max-per-payment, daily/session caps, and optional payee allowlist.",
            },
            {
              t: "Register Agent",
              d: "Bind an agent address that can spend only inside policy — name, budget, limits.",
            },
            {
              t: "Spend & Ledger",
              d: "Agents pay with a reason. Rejections are onchain. Fees show as USD, never Gwei.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-white/5 bg-ink-950/60 p-5">
              <h3 className="text-sm font-semibold text-white">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold text-white">Why Arc in 10 seconds</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
            <li>
              <span className="font-medium text-arc-300">USDC-native L1</span> — balances and gas
              speak dollars. One ERC-20 USDC view (6 decimals); no double-counting native 18-dec gas.
            </li>
            <li>
              <span className="font-medium text-arc-300">Microgrant-ready fees</span> — typical
              transfer cost ~{TYPICAL_FEE_USD}, so $25 stipends stay sensible.
            </li>
            <li>
              <span className="font-medium text-arc-300">Circle infrastructure</span> — Arc
              mainnet 5042 / testnet 5042002 with first-class explorers and RPCs.
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-ink-900/50 p-6 font-mono text-xs leading-relaxed text-slate-400">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Architecture</p>
          <pre className="overflow-x-auto whitespace-pre text-[11px] text-slate-300">{`Owner ──fund/pause/policy──▶ AgentTill (escrow)
                              │
Agent ──spend(amount,payee,memo)──▶ Policy checks
                              │
                         USDC transfer → Payee
                              │
                         PaymentExecuted event → Ledger`}</pre>
        </div>
      </section>
    </div>
  );
}
