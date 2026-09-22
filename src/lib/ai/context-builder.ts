import "server-only";

/**
 * The Context Builder — the piece that makes Aura AI "profile-aware"
 * instead of a generic chatbot (PROJECT spec §11). It gathers only the
 * information relevant to answering a question about ONE specific care
 * profile, bounded and capped, and hands Gemini a small structured object
 * instead of database access or the whole history.
 *
 * WHY NOT "DUMP THE DATABASE": (1) token cost and latency scale with
 * context size for no benefit past a point, (2) a smaller, curated context
 * is easier to reason about and audit — anyone can read this file and see
 * exactly what Gemini is allowed to know for a given request, (3) it keeps
 * a hard boundary against ever including another care profile's data,
 * enforced by construction (every query below is scoped to one
 * `careProfileId`, via the same RLS-respecting client every other read
 * uses).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { computeCurrentStatus } from "@/lib/analytics/analysis-engine";
import { discoverPatterns, type PatternFinding } from "@/lib/patterns/pattern-engine";
import { METRIC_META, STATE_META, type Metric } from "@/types/domain";

type Client = SupabaseClient<Database>;

const RECENT_EVENTS_LIMIT = 8;
const RECENT_OBSERVATIONS_LIMIT = 8;
const RECENT_INSIGHTS_LIMIT = 3;

export interface AuraAiContext {
  profile: {
    displayName: string;
    ageRange: string | null;
    preferredLanguage: string;
    communicationPreferences: Record<string, unknown>;
  };
  knownTriggers: string[];
  knownSupportStrategies: string[];
  currentStatus: {
    state: string;
    stateDescription: string;
    asOf: string | null;
    metrics: {
      metric: string;
      label: string;
      value: number;
      unit: string;
      baselineMean: number | null;
      percentDeviation: number | null;
    }[];
    hasSufficientBaseline: boolean;
  };
  recentEvents: {
    state: string;
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;
  }[];
  recentObservations: {
    occurredAt: string;
    environment: string | null;
    activity: string | null;
    possibleTrigger: string | null;
    supportAction: string | null;
    notes: string | null;
    outcome: string | null;
  }[];
  detectedPatterns: PatternFinding[];
  recentAiInsights: { kind: string; generatedAt: string; summary: string }[];
}

export async function buildAuraAiContext(supabase: Client, careProfileId: string): Promise<AuraAiContext> {
  const [{ data: careProfile }, { data: triggers }, { data: strategies }, status, { data: events }, { data: observations }, patterns, { data: insights }] =
    await Promise.all([
      supabase.from("care_profiles").select("*").eq("id", careProfileId).single(),
      supabase.from("triggers").select("label").eq("care_profile_id", careProfileId),
      supabase.from("support_strategies").select("label").eq("care_profile_id", careProfileId),
      computeCurrentStatus(supabase, careProfileId),
      supabase
        .from("events")
        .select("*")
        .eq("care_profile_id", careProfileId)
        .order("started_at", { ascending: false })
        .limit(RECENT_EVENTS_LIMIT),
      supabase
        .from("observations")
        .select("*")
        .eq("care_profile_id", careProfileId)
        .order("occurred_at", { ascending: false })
        .limit(RECENT_OBSERVATIONS_LIMIT),
      discoverPatterns(supabase, careProfileId),
      supabase
        .from("ai_insights")
        .select("kind, generated_at, content")
        .eq("care_profile_id", careProfileId)
        .order("generated_at", { ascending: false })
        .limit(RECENT_INSIGHTS_LIMIT),
    ]);

  if (!careProfile) throw new Error("Care profile not found for context builder.");

  const metrics = (Object.keys(METRIC_META) as Metric[])
    .map((metric) => {
      const value = status.latestReading?.[metric];
      if (value == null) return null;
      const deviation = status.deviation.perMetric[metric];
      return {
        metric,
        label: METRIC_META[metric].label,
        value,
        unit: METRIC_META[metric].unit,
        baselineMean: deviation?.baselineMean ?? null,
        percentDeviation: deviation?.percentDeviation ?? null,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return {
    profile: {
      displayName: careProfile.display_name,
      ageRange: careProfile.age_range,
      preferredLanguage: careProfile.preferred_language,
      communicationPreferences: careProfile.communication_preferences,
    },
    knownTriggers: (triggers ?? []).map((t) => t.label),
    knownSupportStrategies: (strategies ?? []).map((s) => s.label),
    currentStatus: {
      state: status.state,
      stateDescription: STATE_META[status.state].description,
      asOf: status.latestReading?.recorded_at ?? null,
      metrics,
      hasSufficientBaseline: status.deviation.metricsUsed > 0,
    },
    recentEvents: (events ?? []).map((e) => ({
      state: e.state,
      startedAt: e.started_at,
      endedAt: e.ended_at,
      durationMinutes: e.ended_at
        ? Math.round((new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 60000)
        : null,
    })),
    recentObservations: (observations ?? []).map((o) => ({
      occurredAt: o.occurred_at,
      environment: o.environment,
      activity: o.activity,
      possibleTrigger: o.possible_trigger,
      supportAction: o.support_action,
      notes: o.notes,
      outcome: o.outcome,
    })),
    detectedPatterns: patterns,
    recentAiInsights: (insights ?? []).map((i) => ({
      kind: i.kind,
      generatedAt: i.generated_at,
      summary: typeof i.content === "object" && i.content && "summary" in i.content ? String((i.content as Record<string, unknown>).summary) : "",
    })),
  };
}
