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
