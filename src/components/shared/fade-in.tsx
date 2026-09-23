"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mount-triggered fade/slide-up reveal — the in-app-page counterpart to
 * `ScrollReveal` (which is scroll-triggered, for the landing page). Content
 * inside the authenticated app is server-rendered and usually already above
 * the fold, so it reveals a beat after mount instead of waiting for a
 * scroll intersection. Pass `delayMs` (e.g. `i * 60`, capped) to stagger a
 * list of siblings into a sequence rather than have them all pop at once.
 *
 * Reuses the same `[data-reveal]` CSS in globals.css as `ScrollReveal`, so
 * it automatically respects `prefers-reduced-motion` too.
 */
export function FadeIn({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  /** Render as something other than a div — e.g. "li" inside an <ol>/<ul>, so the reveal wrapper doesn't break list markup. */
  as?: "div" | "li";
}) {
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => setRevealed(true), delayMs);
    return () => clearTimeout(timerRef.current);
  }, [delayMs]);

  return (
    <Tag data-reveal data-revealed={revealed} className={className}>
      {children}
    </Tag>
  );
}

/** Caps per-item stagger so long lists don't take forever to finish revealing. */
export function staggerDelay(index: number, stepMs = 60, maxSteps = 8): number {
  return Math.min(index, maxSteps) * stepMs;
}
