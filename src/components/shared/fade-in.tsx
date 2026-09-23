"use client";

import { useEffect, useRef, useState } from "react";

export function FadeIn({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
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
