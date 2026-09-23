const STATS = [
  { value: "5", label: "Physiological signals tracked" },
  { value: "15", label: "Postgres tables, fully schemed" },
  { value: "100%", label: "Row Level Security coverage" },
  { value: "6", label: "Structured sections per AI answer" },
];

export function StatsBand() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-black/5 bg-black/5 md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="card-hover flex flex-col gap-1.5 bg-white p-6 text-center md:p-8">
            <span className="gradient-text-brand text-4xl font-semibold md:text-5xl">{stat.value}</span>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
