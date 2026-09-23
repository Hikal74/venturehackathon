import { cn } from "@/lib/utils";

/**
 * The AuraLink Care wordmark's icon — a small gradient mark used everywhere
 * the logo appears (nav, auth layout, onboarding header). Pure CSS, no
 * image asset. The faint pulsing ring is a tiny reference to the product's
 * signal-pulse motif (see shared/signal-pulse.tsx) — a quiet "live" cue,
 * not a decoration; restrained enough to disappear at a glance.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex h-3 w-3 shrink-0", className)}>
      <span
        className="signal-pulse-ring absolute inset-0 rounded-full opacity-40"
        style={{ background: "var(--gradient-brand)" }}
      />
      <span className="relative h-full w-full rounded-full" style={{ background: "var(--gradient-brand)" }} />
    </span>
  );
}
