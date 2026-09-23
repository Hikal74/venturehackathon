import type { LucideIcon } from "lucide-react";
import { EvidenceTag } from "@/components/shared/evidence-tag";
import type { EvidenceKind } from "@/types/domain";

export function ResponseSection({
  icon: Icon,
  title,
  evidence,
  children,
}: {
  icon: LucideIcon;
  title: string;
  evidence: EvidenceKind;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-1 flex-col gap-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          <EvidenceTag kind={evidence} />
        </div>
        <p className="text-body-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
