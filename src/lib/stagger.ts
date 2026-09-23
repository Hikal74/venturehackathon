/**
 * Pure math, no React/browser dependency — deliberately NOT in
 * components/shared/fade-in.tsx, even though it's only ever used
 * alongside <FadeIn>. That file is "use client", and Next.js's RSC
 * boundary only allows a Server Component to render a Client Component
 * or pass it props — it can't call a plain function re-exported from a
 * "use client" module. Keeping this here lets Server Component pages
 * (Dashboard, Patterns, ...) compute delayMs and pass it down as a prop.
 */

/** Caps per-item stagger so long lists don't take forever to finish revealing. */
export function staggerDelay(index: number, stepMs = 60, maxSteps = 8): number {
  return Math.min(index, maxSteps) * stepMs;
}
