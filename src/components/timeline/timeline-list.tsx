import { AlertCircle, CheckCircle2, MessageSquareText, Sparkles } from "lucide-react";
import type { TimelineEntry, TimelineEntryKind } from "@/services/timeline";
import { EvidenceTag } from "@/components/shared/evidence-tag";
import { FadeIn } from "@/components/shared/fade-in";
import { staggerDelay } from "@/lib/stagger";
import { formatTime } from "@/lib/timezone";
import { cn } from "@/lib/utils";

const ICONS: Record<TimelineEntryKind, React.ComponentType<{ className?: string }>> = {
  event_start: AlertCircle,
  event_end: CheckCircle2,
  observation: MessageSquareText,
  ai_insight: Sparkles,
};

const ICON_COLOR: Record<TimelineEntryKind, string> = {
  event_start: "text-status-serious",
  event_end: "text-status-good",
  observation: "text-status-warning",
  ai_insight: "text-status-recovering",
};

const EVIDENCE: Record<TimelineEntryKind, "calculated" | "observed" | "inferred"> = {
  event_start: "calculated",
  event_end: "calculated",
  observation: "observed",
  ai_insight: "inferred",
};

export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No activity recorded for this day yet.</p>;
  }

  return (
    <ol className="flex flex-col">
      {entries.map((entry, i) => {
        const Icon = ICONS[entry.kind];
        return (
          <FadeIn
            key={i}
            as="li"
            delayMs={staggerDelay(i, 45)}
            className="flex gap-4 rounded-xl p-2 transition-colors duration-200 hover:bg-secondary/40"
          >
            <div className="flex flex-col items-center">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary", ICON_COLOR[entry.kind])}>
                <Icon className="h-4 w-4" />
              </div>
              {i < entries.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {formatTime(entry.time, { hour: "numeric", minute: "2-digit" })}
                </span>
                <EvidenceTag kind={EVIDENCE[entry.kind]} />
              </div>
              <p className="mt-1 text-sm font-medium">{entry.title}</p>
              {entry.description && <p className="mt-0.5 text-sm text-muted-foreground">{entry.description}</p>}
            </div>
          </FadeIn>
        );
      })}
    </ol>
  );
}
