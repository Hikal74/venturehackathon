import { CheckCircle2, Sparkles } from "lucide-react";

/**
 * Abstract, layered glassmorphic UI mockup for the hero — per the
 * HealthTech Minimalist brief's "no stock photos of doctors" rule.
 * Everything here is decorative CSS/SVG built from this app's own design
 * tokens; it is not a screenshot and doesn't claim to be one.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto h-72 w-full max-w-md sm:h-80">
      {/* Ambient gradient orb */}
      <div
        aria-hidden
        className="pulse-glow absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
      />

      {/* Back layer: a mock signal bar chart */}
      <div
        aria-hidden
        className="glass-panel absolute left-2 top-6 flex h-28 w-48 -rotate-6 items-end gap-1.5 p-4 sm:left-4 sm:top-8"
      >
        {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{ height: `${h}%`, background: "var(--gradient-ai)", opacity: 0.55 }}
          />
        ))}
      </div>

      {/* Front layer: a mock status card, floating */}
      <div className="glass-panel float-slow absolute bottom-4 right-2 flex w-56 flex-col gap-3 p-5 sm:right-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--brand-violet)" }} />
          Aura AI
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-good/15">
            <CheckCircle2 className="h-5 w-5 text-status-good" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Calm</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Within baseline range</p>
          </div>
        </div>
        <svg viewBox="0 0 200 40" className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
          <path
            d="M0,28 C15,26 25,10 40,14 C55,18 65,30 80,26 C95,22 105,8 120,10 C135,12 145,24 160,20 C175,16 185,10 200,14"
            fill="none"
            stroke="var(--brand-cobalt)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
