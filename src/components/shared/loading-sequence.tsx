"use client";

import { useEffect, useState } from "react";

export function LoadingSequence({ messages, className }: { messages: string[]; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => Math.min(i + 1, messages.length - 1)), 1400);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className={className} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex h-2 w-2 shrink-0">
          <span className="signal-pulse-ring absolute inset-0 rounded-full" style={{ background: "var(--gradient-ai)" }} />
          <span className="relative h-full w-full rounded-full" style={{ background: "var(--gradient-ai)" }} />
        </span>
        <span className="text-body-sm text-foreground">{messages[index]}</span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {messages.map((m, i) => (
          <span
            key={m}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i <= index ? "var(--brand-teal)" : "var(--border)" }}
          />
        ))}
      </div>
    </div>
  );
}
