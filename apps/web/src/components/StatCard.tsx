export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "blue" | "green" | "amber" | "rose";
}) {
  const ring =
    accent === "green"
      ? "from-emerald-500/20"
      : accent === "amber"
        ? "from-amber-500/20"
        : accent === "rose"
          ? "from-rose-500/20"
          : "from-arc-500/20";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${ring} to-ink-900 p-5 shadow-glow`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
