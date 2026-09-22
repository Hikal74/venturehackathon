"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fade-in-on-scroll wrapper for landing-page sections (per the HealthTech
 * Minimalist brief's "fluid, kinetic motion" guidance). Pure presentation —
 * wraps children without altering what they render or any data flow.
 * Respects prefers-reduced-motion via the CSS in globals.css ([data-reveal]).
 */
export function ScrollReveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setRevealed(true), delayMs);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [delayMs]);

  return (
    <div ref={ref} data-reveal data-revealed={revealed} className={className}>
      {children}
    </div>
  );
}
