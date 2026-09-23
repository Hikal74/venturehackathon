import { cn } from "@/lib/utils";

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
