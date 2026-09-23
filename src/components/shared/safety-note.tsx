import { Info } from "lucide-react";

/**
 * The "confidence & limitations" disclosure that ends every Aura AI
 * response — design brief §9: "medical safety should be part of the
 * interface design rather than hidden inside a disclaimer at the bottom."
 * This is routine, honest uncertainty ("only three days of history yet"),
 * not a warning, so it stays calm: a quiet tinted card with an Info icon,
 * not red, not an alert role — always visible, never a popup someone has
 * to dismiss. There's no urgent-tier variant here because AuraLink's own
 * guardrails (lib/ai/guardrails.ts) never produce an urgent medical claim
 * for Aura AI to surface; STATE_META's status colors already cover
 * genuine elevation severity elsewhere in the product.
 */
export function SafetyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-secondary/60 p-3.5">
      <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-foreground">Confidence &amp; limitations</span>
        <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
