import { EVIDENCE_META, type EvidenceKind } from "@/types/domain";
import { cn } from "@/lib/utils";

const STYLES: Record<EvidenceKind, string> = {
  measured: "bg-secondary text-secondary-foreground",
  calculated: "bg-status-recovering/10 text-status-recovering",
  observed: "bg-status-warning/15 text-[#8a5a00]",
  inferred: "bg-status-serious/10 text-status-serious",
};

/**
 * The evidence-kind badge that makes AuraLink's responsible-AI distinction
 * (measured / calculated / observed / inferred — see docs/AI_SYSTEM.md)
 * visible in the UI itself, not just in a policy document. Used on metric
 * cards, timeline entries, and every Aura AI structured response section.
 */
export function EvidenceTag({ kind, className }: { kind: EvidenceKind; className?: string }) {
  const meta = EVIDENCE_META[kind];
  return (
    <span
      title={meta.description}
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", STYLES[kind], className)}
    >
      {meta.label}
    </span>
  );
}
