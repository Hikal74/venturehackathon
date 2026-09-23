/**
 * A branded "Aura AI is composing a reply" cue for chat, distinct from
 * LoadingSequence (which is for a single heavier action like What
 * Changed). Chat turns happen rapidly back and forth, so this stays
 * lightweight — three dots, not a multi-stage narrative — while still
 * being specific to the product (the AI gradient) rather than a generic
 * spinner. Pure CSS animation, respects prefers-reduced-motion via the
 * same [data-reveal]-adjacent convention as the rest of the motion system
 * (see .typing-dot in globals.css).
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1" role="status" aria-label="Aura AI is composing a reply">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--gradient-ai)", animationDelay: `${i * 160}ms` }}
        />
      ))}
    </div>
  );
}
