import { STATE_META, type CareProfileState } from "@/types/domain";
import { EvidenceTag } from "@/components/shared/evidence-tag";
import { formatDateTime } from "@/lib/timezone";
import type { ReportContent } from "@/services/reports";

export function ReportView({ report, careProfileName }: { report: ReportContent; careProfileName: string }) {
  return (
    <div className="flex flex-col gap-6 print:gap-4">
      <div>
        <h2 className="text-lg font-semibold">{report.periodLabel}</h2>
        <p className="text-sm text-muted-foreground">{careProfileName}</p>
      </div>

      <Section title="Overview">
        <p className="text-sm text-muted-foreground">{report.overview}</p>
      </Section>

      <Section title="Baseline comparison" evidence="calculated">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {report.baselineComparison.map((c) => (
            <div key={c.metric} className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              {Number.isNaN(c.periodAverage) ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <>
                  <p className="text-lg font-semibold tabular-nums">
                    {c.periodAverage.toFixed(1)} {c.unit}
                  </p>
                  {c.percentDeviation != null && (
                    <p className="text-xs text-muted-foreground">
                      {c.percentDeviation >= 0 ? "+" : ""}
                      {Math.round(c.percentDeviation)}% vs. baseline
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Notable events" evidence="calculated">
        {report.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">None recorded.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {report.events.map((e, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{STATE_META[e.state as CareProfileState]?.label ?? e.state}</span>{" "}
                <span className="text-muted-foreground">
                  {formatDateTime(e.startedAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  {e.durationMinutes != null && ` · ${e.durationMinutes} min`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Caregiver observations" evidence="observed">
        {report.observations.length === 0 ? (
          <p className="text-sm text-muted-foreground">None recorded.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {report.observations.map((o, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {[o.environment, o.activity].filter(Boolean).join(" — ") || "Observation"}
                </span>
                {o.possible_trigger && ` · Possible trigger: ${o.possible_trigger}`}
                {o.support_action && ` · Support: ${o.support_action}`}
                {o.outcome && ` · Outcome: ${o.outcome}`}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Detected patterns" evidence="inferred">
        {report.detectedPatterns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No repeated pattern surfaced yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {report.detectedPatterns.map((p, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{p.title}.</span> {p.description}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Support actions recorded" evidence="observed">
        {report.supportActionsUsed.length === 0 ? (
          <p className="text-sm text-muted-foreground">None recorded.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {report.supportActionsUsed.map((s) => (
              <li key={s.action} className="rounded-full border border-border px-3 py-1 text-xs">
                {s.action} × {s.count}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recovery pattern" evidence="calculated">
        <p className="text-sm text-muted-foreground">{report.recoveryNotes}</p>
      </Section>

      <Section title="Questions worth discussing with a qualified professional">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
          {report.questionsForProfessional.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  evidence,
  children,
}: {
  title: string;
  evidence?: "measured" | "calculated" | "observed" | "inferred";
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4 first:border-0 first:pt-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {evidence && <EvidenceTag kind={evidence} />}
      </div>
      {children}
    </div>
  );
}
