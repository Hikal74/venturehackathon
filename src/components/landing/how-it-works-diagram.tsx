import { Activity, Brain, HeartHandshake, TrendingUp } from "lucide-react";

/**
 * Replaces four small text-xs cards with a real connected-flow diagram —
 * bigger text, a visible pipeline instead of an unordered grid, and the
 * product's own signal-pulse line motif doing double duty as the
 * connector between steps (not a generic arrow). Desktop: a horizontal
 * row with traveling lines between nodes. Mobile: the same nodes stacked
 * vertically with a short vertical connector, so nothing overflows a
 * narrow screen.
 */
const STEPS = [
  {
    icon: Activity,
    step: "Sense",
    desc: "Wearable-simulated signals: heart rate, HRV, GSR, skin temperature, activity.",
  },
  {
    icon: Brain,
    step: "Understand",
    desc: "Compared against this person's own baseline — never a population average.",
  },
  {
    icon: HeartHandshake,
    step: "Support",
    desc: "Prioritizes strategies already known to help this specific individual.",
  },
  {
    icon: TrendingUp,
    step: "Learn",
    desc: "Patterns discovered over time from real recorded history, not assumptions.",
  },
];

export function HowItWorksDiagram() {
  return (
    <div className="relative">
      {/* Connector row — desktop only, sits behind the nodes */}
      <div className="pointer-events-none absolute inset-x-0 top-9 hidden md:block">
        <svg viewBox="0 0 100 2" preserveAspectRatio="none" className="h-[2px] w-full" aria-hidden>
          <line x1="12.5" y1="1" x2="87.5" y2="1" stroke="var(--border)" strokeWidth="2" />
          <line
            x1="12.5"
            y1="1"
            x2="87.5"
            y2="1"
            stroke="url(#how-it-works-gradient)"
            strokeWidth="2"
            strokeDasharray="15 60"
            className="diagram-connector"
          />
          <defs>
            <linearGradient id="how-it-works-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--brand-cyan)" />
              <stop offset="100%" stopColor="var(--brand-violet)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        {STEPS.map((item, i) => (
          <div key={item.step} className="card-hover relative flex flex-col items-center gap-3 rounded-3xl border border-black/5 bg-white p-6 text-center">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ background: i % 2 === 0 ? "var(--gradient-brand)" : "var(--gradient-ai)" }}
            >
              <item.icon className="h-6 w-6" />
            </div>
            <span
              className="text-xs font-bold tracking-wide uppercase"
              style={{ color: i % 2 === 0 ? "var(--brand-cobalt)" : "var(--brand-violet)" }}
            >
              Step {i + 1}
            </span>
            <span className="text-lg font-semibold">{item.step}</span>
            <p className="text-body-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
