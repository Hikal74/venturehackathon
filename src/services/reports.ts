import "server-only";

/**
 * Daily Summary / Weekly Aura Report (PROJECT spec §20). Entirely
 * deterministic — computed from stored sensor_readings/events/observations
 * plus the same Pattern Discovery engine the Patterns page uses. No Gemini
 * call is required to view a report, consistent with spec §27 (deterministic
 * analytics must work even if the AI provider is down).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { computeMetricBaseline, computeMetricDeviation } from "@/lib/analytics/baseline-engine";
import { computeBaselinesForProfile } from "@/lib/analytics/analysis-engine";
import { discoverPatterns, type PatternFinding } from "@/lib/patterns/pattern-engine";
import { listEventsInRange } from "./events";
import { listObservationsInRange } from "./observations";
import { astanaDateParam, formatDate, startOfDayInAstana } from "@/lib/timezone";
import { METRICS, METRIC_META, type Metric } from "@/types/domain";

type Client = SupabaseClient<Database>;
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ObservationRow = Database["public"]["Tables"]["observations"]["Row"];

export interface MetricComparison {
  metric: Metric;
  label: string;
  unit: string;
  periodAverage: number;
  baselineMean: number | null;
  percentDeviation: number | null;
}

export interface ReportContent {
  [key: string]: unknown;
  periodLabel: string;
  overview: string;
  baselineComparison: MetricComparison[];
  events: { state: string; startedAt: string; endedAt: string | null; durationMinutes: number | null }[];
  observations: Pick<ObservationRow, "occurred_at" | "environment" | "activity" | "possible_trigger" | "support_action" | "notes" | "outcome">[];
  detectedPatterns: PatternFinding[];
  supportActionsUsed: { action: string; count: number }[];
  recoveryNotes: string;
  questionsForProfessional: string[];
}

async function buildComparisons(
  supabase: Client,
  careProfileId: string,
  readings: Database["public"]["Tables"]["sensor_readings"]["Row"][],
  asOf: Date
): Promise<MetricComparison[]> {
  const baselines = await computeBaselinesForProfile(supabase, careProfileId, asOf);

  return METRICS.map((metric) => {
    const values = readings.map((r) => r[metric]).filter((v): v is number => v != null);
    if (values.length === 0) {
      return { metric, label: METRIC_META[metric].label, unit: METRIC_META[metric].unit, periodAverage: NaN, baselineMean: null, percentDeviation: null };
    }
    const periodBaseline = computeMetricBaseline(values);
    const baseline = baselines[metric];
    const deviation = baseline && baseline.sampleCount > 0 ? computeMetricDeviation(periodBaseline.mean, baseline) : null;

    return {
      metric,
      label: METRIC_META[metric].label,
      unit: METRIC_META[metric].unit,
      periodAverage: periodBaseline.mean,
      baselineMean: deviation?.baselineMean ?? null,
      percentDeviation: deviation?.percentDeviation ?? null,
    };
  });
}

function buildQuestionsForProfessional(patterns: PatternFinding[], events: EventRow[]): string[] {
  const questions: string[] = [];
  const repeated = patterns.filter((p) => p.evidenceCount >= 3);
  for (const pattern of repeated.slice(0, 3)) {
    questions.push(`The pattern "${pattern.title}" has repeated ${pattern.evidenceCount} times — worth mentioning to a specialist?`);
  }
  if (events.filter((e) => e.state === "high_elevation").length >= 2) {
    questions.push("There were multiple high-elevation periods in this window — a specialist may want the full timeline.");
  }
  if (questions.length === 0) {
    questions.push("No specific concerns stood out this period based on available data.");
  }
  return questions;
}

async function buildReport(
  supabase: Client,
  careProfileId: string,
  periodStart: Date,
  periodEnd: Date,
  periodLabel: string
): Promise<ReportContent> {
  const [{ data: readings, error: readingsError }, events, observations, patterns] = await Promise.all([
    supabase
      .from("sensor_readings")
      .select("*")
      .eq("care_profile_id", careProfileId)
      .gte("recorded_at", periodStart.toISOString())
      .lte("recorded_at", periodEnd.toISOString()),
    listEventsInRange(supabase, careProfileId, periodStart, periodEnd),
    listObservationsInRange(supabase, careProfileId, periodStart, periodEnd),
    discoverPatterns(supabase, careProfileId),
  ]);
  if (readingsError) throw new Error(`Failed to load readings for report: ${readingsError.message}`);

  const comparisons = await buildComparisons(supabase, careProfileId, readings ?? [], periodEnd);

  const closedEvents = events.filter((e) => e.ended_at);
  const avgRecoveryMinutes =
    closedEvents.length > 0
      ? closedEvents.reduce((sum, e) => sum + (new Date(e.ended_at!).getTime() - new Date(e.started_at).getTime()) / 60000, 0) / closedEvents.length
      : null;

  const supportCounts = new Map<string, number>();
  for (const obs of observations) {
    if (!obs.support_action) continue;
    const key = obs.support_action.trim();
    supportCounts.set(key, (supportCounts.get(key) ?? 0) + 1);
  }

  const overview =
    events.length === 0
      ? `No elevated periods were recorded during ${periodLabel.toLowerCase()}.`
      : `${events.length} elevated period${events.length === 1 ? "" : "s"} recorded during ${periodLabel.toLowerCase()}, with ${observations.length} caregiver observation${observations.length === 1 ? "" : "s"} logged.`;

  return {
    periodLabel,
    overview,
    baselineComparison: comparisons,
    events: events.map((e) => ({
      state: e.state,
      startedAt: e.started_at,
      endedAt: e.ended_at,
      durationMinutes: e.ended_at ? Math.round((new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 60000) : null,
    })),
    observations: observations.map((o) => ({
      occurred_at: o.occurred_at,
      environment: o.environment,
      activity: o.activity,
      possible_trigger: o.possible_trigger,
      support_action: o.support_action,
      notes: o.notes,
      outcome: o.outcome,
    })),
    detectedPatterns: patterns,
    supportActionsUsed: Array.from(supportCounts.entries()).map(([action, count]) => ({ action, count })),
    recoveryNotes:
      avgRecoveryMinutes != null
        ? `Average time to return toward baseline: about ${Math.round(avgRecoveryMinutes)} minutes across ${closedEvents.length} resolved episode${closedEvents.length === 1 ? "" : "s"}.`
        : "No resolved episodes in this period to measure recovery time.",
    questionsForProfessional: buildQuestionsForProfessional(patterns, events),
  };
}

function toDateOnly(date: Date): string {
  return astanaDateParam(date);
}

/**
 * Reports are recomputed fresh on every view (the underlying data can
 * change — a caregiver might add an observation after the fact) and then
 * upserted as a snapshot into daily_summaries/weekly_reports, so those
 * tables hold a real, timestamped record of what was shown rather than
 * sitting empty. Regenerating is idempotent — the unique constraint on
 * (care_profile_id, period_date/period_start) means re-viewing the same
 * day just replaces its snapshot.
 */
export async function getDailySummary(supabase: Client, careProfileId: string, day: Date): Promise<ReportContent> {
  const start = startOfDayInAstana(day);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  const content = await buildReport(supabase, careProfileId, start, end, `Daily Summary — ${formatDate(start)}`);

  const { error } = await supabase
    .from("daily_summaries")
    .upsert({ care_profile_id: careProfileId, period_date: toDateOnly(start), content }, { onConflict: "care_profile_id,period_date" });
  if (error) console.error("Failed to persist daily summary snapshot:", error.message);

  return content;
}

export async function getWeeklyReport(supabase: Client, careProfileId: string, weekStart: Date): Promise<ReportContent> {
  const start = startOfDayInAstana(weekStart);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  const content = await buildReport(supabase, careProfileId, start, end, `Weekly Aura Report — ${formatDate(start)} to ${formatDate(end)}`);

  const { error } = await supabase
    .from("weekly_reports")
    .upsert(
      { care_profile_id: careProfileId, period_start: toDateOnly(start), period_end: toDateOnly(end), content },
      { onConflict: "care_profile_id,period_start" }
    );
  if (error) console.error("Failed to persist weekly report snapshot:", error.message);

  return content;
}
