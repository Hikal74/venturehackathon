import { redirect } from "next/navigation";
import { Clock, Link2, TrendingDown } from "lucide-react";
import { getSessionContext } from "@/lib/session";
import { discoverPatterns, type PatternKind } from "@/lib/patterns/pattern-engine";
import { EvidenceTag } from "@/components/shared/evidence-tag";
import { FadeIn, staggerDelay } from "@/components/shared/fade-in";

const KIND_META: Record<PatternKind, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  time_of_day: { label: "Time-of-day pattern", icon: Clock },
  context_association: { label: "Context association", icon: Link2 },
  recovery_speed: { label: "Recovery pattern", icon: TrendingDown },
};

export default async function PatternsPage() {
  const { supabase, active } = await getSessionContext();
  if (!active) redirect("/onboarding");

  const patterns = await discoverPatterns(supabase, active.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Patterns</h1>
        <p className="text-sm text-muted-foreground">
          Calculated from {active.display_name}&apos;s stored history over the last 30 days — no AI call involved,
          so this stays available even if Aura AI is temporarily unavailable.
        </p>
      </div>

      {patterns.length === 0 ? (
        <FadeIn className="clay p-8 text-center text-sm text-muted-foreground">
          Not enough repeated history yet to surface a pattern. Patterns need the same kind of elevation or context
          to repeat at least a few times — check back as more data comes in, or send some via the Device Simulator.
        </FadeIn>
      ) : (
        <div className="flex flex-col gap-3">
          {patterns.map((pattern, i) => {
            const meta = KIND_META[pattern.kind];
            const Icon = meta.icon;
            return (
              <FadeIn key={i} delayMs={staggerDelay(i, 70)} className="clay card-hover flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-status-recovering/10 text-status-recovering">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{pattern.title}</h2>
                    <EvidenceTag kind="inferred" />
                  </div>
                  <p className="text-sm text-muted-foreground">{pattern.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Based on {pattern.evidenceCount} of {pattern.sampleSize} observed{" "}
                    {pattern.kind === "recovery_speed" ? "episodes" : "days"}.
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Patterns describe associations found in this profile&apos;s own recorded history. They never establish that
        one thing causes another, and they are not a medical assessment.
      </p>
    </div>
  );
}
