import "server-only";

/**
 * Wires the pure baseline-engine math to the database: reads a trailing
 * window of sensor_readings, computes each metric's baseline and the
 * combined deviation score, classifies a display state, and manages the
 * lifecycle of `events` rows (open one when elevation starts, update its
 * peak while it continues, mark it "recovering" then close it as signals
 * return toward baseline).
 *
 * This module is called from two places:
 *   - services/sensor-ingestion.ts, right after a new reading is inserted
 *     (this is what actually creates/updates/closes events and writes a
 *     baseline_metrics snapshot)
 *   - the dashboard page, to render "how is this person doing right now"
 *     (read-only — computeCurrentStatus never writes)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { METRICS, isEventState, type Metric, type CareProfileState } from "@/types/domain";
import {
  BASELINE_EXCLUDE_RECENT_MINUTES,
  BASELINE_WINDOW_DAYS,
  classifyState,
  computeMetricBaseline,
  computeOverallDeviationScore,
  type MetricBaseline,
  type OverallDeviation,
} from "./baseline-engine";

type Client = SupabaseClient<Database>;
type SensorReadingRow = Database["public"]["Tables"]["sensor_readings"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

export interface StatusResult {
  latestReading: SensorReadingRow | null;
  baselines: Partial<Record<Metric, MetricBaseline>>;
  deviation: OverallDeviation;
  state: CareProfileState;
  openEvent: EventRow | null;
}

/**
 * Elevated periods we already know about are excluded from the baseline
 * window before computing "typical." Without this, a person who has
 * frequent real elevation episodes would gradually have those episodes
 * absorbed into their own "normal," making the baseline less sensitive over
 * time — the opposite of what a caregiver wants. This is a simple
 * refinement (documented, not a hidden judgment call) over a plain rolling
 * window; a production system might do something more robust (trimmed
 * statistics, a proper anomaly-robust estimator).
 */
async function fetchExcludedIntervals(
  supabase: Client,
  careProfileId: string,
  windowStart: Date,
  windowEnd: Date
): Promise<{ start: number; end: number }[]> {
  const { data, error } = await supabase
    .from("events")
    .select("started_at, ended_at")
    .eq("care_profile_id", careProfileId)
    .lte("started_at", windowEnd.toISOString())
    .or(`ended_at.is.null,ended_at.gte.${windowStart.toISOString()}`);

  if (error) throw new Error(`Failed to load events for baseline exclusion: ${error.message}`);

  return (data ?? []).map((event) => ({
    start: new Date(event.started_at).getTime(),
    end: event.ended_at ? new Date(event.ended_at).getTime() : windowEnd.getTime(),
  }));
}

/** Exported for reuse outside this module (e.g. reports.ts comparing a past period's averages against the same trailing-baseline concept the dashboard uses). */
export async function computeBaselinesForProfile(
  supabase: Client,
  careProfileId: string,
  asOf: Date
): Promise<Partial<Record<Metric, MetricBaseline>>> {
  return fetchBaselines(supabase, careProfileId, asOf);
}

async function fetchBaselines(
  supabase: Client,
  careProfileId: string,
  asOf: Date
): Promise<Partial<Record<Metric, MetricBaseline>>> {
  const windowStart = new Date(asOf.getTime() - BASELINE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(asOf.getTime() - BASELINE_EXCLUDE_RECENT_MINUTES * 60 * 1000);

  const [{ data, error }, excludedIntervals] = await Promise.all([
    supabase
      .from("sensor_readings")
      .select("recorded_at, heart_rate, hrv, gsr, skin_temp, activity_level")
      .eq("care_profile_id", careProfileId)
      .gte("recorded_at", windowStart.toISOString())
      .lte("recorded_at", windowEnd.toISOString()),
    fetchExcludedIntervals(supabase, careProfileId, windowStart, windowEnd),
  ]);

  if (error) throw new Error(`Failed to load baseline window: ${error.message}`);

  const columns: Record<Metric, "heart_rate" | "hrv" | "gsr" | "skin_temp" | "activity_level"> = {
    heart_rate: "heart_rate",
    hrv: "hrv",
    gsr: "gsr",
    skin_temp: "skin_temp",
    activity_level: "activity_level",
  };

  const eligibleRows = (data ?? []).filter((row) => {
    const t = new Date(row.recorded_at).getTime();
    return !excludedIntervals.some((interval) => t >= interval.start && t <= interval.end);
  });

  const baselines: Partial<Record<Metric, MetricBaseline>> = {};
  for (const metric of METRICS) {
    const values = eligibleRows.map((row) => row[columns[metric]]).filter((v): v is number => typeof v === "number");
    baselines[metric] = computeMetricBaseline(values);
  }
  return baselines;
}

async function fetchLatestReading(supabase: Client, careProfileId: string): Promise<SensorReadingRow | null> {
  const { data, error } = await supabase
    .from("sensor_readings")
    .select("*")
    .eq("care_profile_id", careProfileId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load latest reading: ${error.message}`);
  return data;
}

async function fetchOpenEvent(supabase: Client, careProfileId: string): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("care_profile_id", careProfileId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load open event: ${error.message}`);
  return data;
}

/** Read-only: computes the live status a dashboard should display right now. Never writes. */
export async function computeCurrentStatus(supabase: Client, careProfileId: string): Promise<StatusResult> {
  const latestReading = await fetchLatestReading(supabase, careProfileId);

  if (!latestReading) {
    return {
      latestReading: null,
      baselines: {},
      deviation: { score: 0, perMetric: {}, metricsUsed: 0 },
      state: "insufficient_data",
      openEvent: null,
    };
  }

  const asOf = new Date(latestReading.recorded_at);
  const baselines = await fetchBaselines(supabase, careProfileId, asOf);
  const openEvent = await fetchOpenEvent(supabase, careProfileId);

  const deviation = computeOverallDeviationScore(
    {
      heart_rate: latestReading.heart_rate,
      hrv: latestReading.hrv,
      gsr: latestReading.gsr,
      skin_temp: latestReading.skin_temp,
      activity_level: latestReading.activity_level,
    },
    baselines
  );

  const state = classifyState({
    overallScore: deviation.score,
    metricsUsed: deviation.metricsUsed,
    openEventPeakScore: openEvent?.deviation_score ?? null,
  });

  return { latestReading, baselines, deviation, state, openEvent };
}


/**
 * Called right after a new sensor reading is inserted. Computes status (via
 * computeCurrentStatus) and then reconciles the `events` table:
 *   - no open event + non-calm state -> open a new event
 *   - open event + still non-calm -> keep the event's recorded peak (never
 *     decreases, so an event's `deviation_score` reflects the worst point of
 *     the episode) and refresh its `state` to the current classification
 *   - open event + state has fully returned to calm -> close it (`ended_at`)
 *
 * Also writes a `baseline_metrics` snapshot row per metric used, so the
 * "personal baseline comparison" the dashboard shows is backed by a real,
 * timestamped record rather than only an in-memory computation.
 */
export async function analyzeAndPersist(
  supabase: Client,
  careProfileId: string,
  reading: SensorReadingRow
): Promise<StatusResult & { eventChanged: boolean }> {
  const status = await computeCurrentStatus(supabase, careProfileId);
  let eventChanged = false;

  const { openEvent, state, deviation } = status;

  if (isEventState(state)) {
    const peak = Math.max(Math.abs(deviation.score), Math.abs(openEvent?.deviation_score ?? 0));

    if (!openEvent) {
      const { data, error } = await supabase
        .from("events")
        .insert({
          care_profile_id: careProfileId,
          state,
          deviation_score: peak,
          started_at: reading.recorded_at,
          triggering_reading_id: reading.id,
        })
        .select("*")
        .single();
      if (error) throw new Error(`Failed to open event: ${error.message}`);
      status.openEvent = data;
      eventChanged = true;
    } else if (state !== openEvent.state || peak !== openEvent.deviation_score) {
      const { data, error } = await supabase
        .from("events")
        .update({ state, deviation_score: peak })
        .eq("id", openEvent.id)
        .select("*")
        .single();
      if (error) throw new Error(`Failed to update event: ${error.message}`);
      status.openEvent = data;
      eventChanged = true;
    }
  } else if (openEvent) {
    const { data, error } = await supabase
      .from("events")
      .update({ ended_at: reading.recorded_at })
      .eq("id", openEvent.id)
      .select("*")
      .single();
    if (error) throw new Error(`Failed to close event: ${error.message}`);
    status.openEvent = data;
    eventChanged = true;
  }

  const windowStart = new Date(new Date(reading.recorded_at).getTime() - BASELINE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const snapshotRows = (Object.entries(status.baselines) as [Metric, MetricBaseline][])
    .filter(([, baseline]) => baseline.sampleCount > 0)
    .map(([metric, baseline]) => ({
      care_profile_id: careProfileId,
      metric,
      baseline_mean: baseline.mean,
      baseline_stddev: baseline.stddev,
      sample_count: baseline.sampleCount,
      window_start: windowStart.toISOString(),
      window_end: reading.recorded_at,
    }));

  if (snapshotRows.length > 0) {
    const { error } = await supabase.from("baseline_metrics").insert(snapshotRows);
    if (error) console.error("Failed to persist baseline snapshot:", error.message);
  }

  return { ...status, eventChanged };
}
