import { cn } from "@/lib/utils";

/**
 * The AuraLink Care wordmark's icon — a small gradient mark used everywhere
 * the logo appears (nav, auth layout, onboarding header). Pure CSS, no
 * image asset.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-3 w-3 rounded-full", className)}
      style={{ background: "var(--gradient-brand)" }}
    />
  );
}
