import "server-only";

/**
 * Longitudinal pattern discovery — genuinely computed from stored
 * events/observations (see docs/AI_SYSTEM.md and PROJECT spec §14), never
 * templated or hardcoded to a demo scenario. It happens to surface the
 * patterns the demo seed was designed around because that's honestly what
 * that data contains — the same code runs unchanged over any profile's
 * real history.
 *
 * DOES NOT CALL GEMINI. This is deliberate (see spec §27 "AI failure
 * fallback" and §11 "not merely an LLM wrapper"): pattern counts are
 * arithmetic over your own data, and stay available even if the AI
 * provider is down. Aura AI can reference these findings as CONTEXT when
 * answering a question, but never recomputes or overrides them.
 *
 * RESPONSIBLE FRAMING: every finding is phrased as "X frequently appears
 * alongside elevated signals," never "X causes elevated signals." That
 * wording is enforced here, in the data layer, not left to a prompt.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { mostCommon, mean, capitalize } from "./pattern-utils";

type Client = SupabaseClient<Database>;
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ObservationRow = Database["public"]["Tables"]["observations"]["Row"];

export type PatternKind = "time_of_day" | "context_association" | "recovery_speed";

export interface PatternFinding {
  kind: PatternKind;
  title: string;
  description: string;
  evidenceCount: number;
  sampleSize: number;
}

const LOOKBACK_DAYS = 30;
const TIME_BUCKET_MINUTES = 30;
const MIN_OCCURRENCES = 3;
const MIN_ASSOCIATION_OCCURRENCES = 2;

function normalize(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTimeOfDay(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const period = h < 12 ? "AM" : "PM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}

async function fetchRecentEvents(supabase: Client, careProfileId: string): Promise<EventRow[]> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("care_profile_id", careProfileId)
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: true });
  if (error) throw new Error(`Pattern engine: failed to load events: ${error.message}`);
  return data ?? [];
}

async function fetchObservationsForEvents(supabase: Client, eventIds: string[]): Promise<ObservationRow[]> {
  if (eventIds.length === 0) return [];
  const { data, error } = await supabase.from("observations").select("*").in("event_id", eventIds);
  if (error) throw new Error(`Pattern engine: failed to load observations: ${error.message}`);
  return data ?? [];
}

async function countDistinctDaysWithData(supabase: Client, careProfileId: string): Promise<number> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("sensor_readings")
    .select("recorded_at")
    .eq("care_profile_id", careProfileId)
    .gte("recorded_at", since.toISOString());
  if (error) throw new Error(`Pattern engine: failed to load reading days: ${error.message}`);
  const days = new Set((data ?? []).map((r) => dayKey(new Date(r.recorded_at))));
  return days.size;
}

function timeOfDayFindings(events: EventRow[], observationsByEvent: Map<string, ObservationRow[]>, totalDays: number): PatternFinding[] {
  const buckets = new Map<number, { days: Set<string>; events: EventRow[] }>();

  for (const event of events) {
    const started = new Date(event.started_at);
    const minutesFromMidnight = started.getHours() * 60 + started.getMinutes();
    const bucket = Math.floor(minutesFromMidnight / TIME_BUCKET_MINUTES) * TIME_BUCKET_MINUTES;
    const entry = buckets.get(bucket) ?? { days: new Set<string>(), events: [] };
    entry.days.add(dayKey(started));
    entry.events.push(event);
    buckets.set(bucket, entry);
  }

  const findings: PatternFinding[] = [];
  for (const [bucket, entry] of buckets) {
    if (entry.days.size < MIN_OCCURRENCES) continue;

    const relatedObservations = entry.events.flatMap((e) => observationsByEvent.get(e.id) ?? []);
    const topValue = mostCommon(relatedObservations.map((o) => normalize(o.possible_trigger) ?? normalize(o.environment)));

    const rangeLabel = `${formatTimeOfDay(bucket)}–${formatTimeOfDay(bucket + TIME_BUCKET_MINUTES)}`;
    const daySummary = totalDays > 0 ? `${entry.days.size} of the last ${totalDays} days with data` : `${entry.days.size} days`;

    findings.push({
      kind: "time_of_day",
      title: `Repeated elevation around ${rangeLabel}`,
      description: topValue
        ? `Signals were elevated around ${rangeLabel} on ${daySummary}. The most common associated observation during those periods was "${topValue}" — this is an association, not a confirmed cause.`
        : `Signals were elevated around ${rangeLabel} on ${daySummary}. No consistent caregiver observation has been logged for these periods yet.`,
      evidenceCount: entry.days.size,
      sampleSize: totalDays,
    });
  }

  return findings.sort((a, b) => b.evidenceCount - a.evidenceCount);
}

function contextAssociationFindings(observationsByEvent: Map<string, ObservationRow[]>): PatternFinding[] {
  const allLinkedObservations = Array.from(observationsByEvent.values()).flat();
  const groups = new Map<string, ObservationRow[]>();

  for (const obs of allLinkedObservations) {
    const value = normalize(obs.possible_trigger) ?? normalize(obs.activity);
    if (!value) continue;
    const group = groups.get(value) ?? [];
    group.push(obs);
    groups.set(value, group);
  }

  const findings: PatternFinding[] = [];
  for (const [value, obs] of groups) {
    if (obs.length < MIN_ASSOCIATION_OCCURRENCES) continue;
    findings.push({
      kind: "context_association",
      title: `"${capitalize(value)}" frequently appears alongside elevated signals`,
      description: `${obs.length} elevated periods in the last ${LOOKBACK_DAYS} days had a caregiver observation mentioning "${value}". This does not establish that it causes the change, but the repeated association may be worth monitoring.`,
      evidenceCount: obs.length,
      sampleSize: allLinkedObservations.length,
    });
  }

  return findings.sort((a, b) => b.evidenceCount - a.evidenceCount);
}

function recoverySpeedFindings(events: EventRow[], observationsByEvent: Map<string, ObservationRow[]>): PatternFinding[] {
  const closed = events.filter((e) => e.ended_at);
  if (closed.length < 2) return [];

  const durationsByStrategy = new Map<string, number[]>();
  const allDurations: number[] = [];

  for (const event of closed) {
    const durationMinutes = (new Date(event.ended_at!).getTime() - new Date(event.started_at).getTime()) / 60000;
    allDurations.push(durationMinutes);

    const strategy = mostCommon((observationsByEvent.get(event.id) ?? []).map((o) => normalize(o.support_action)));
    if (!strategy) continue;
    const list = durationsByStrategy.get(strategy) ?? [];
    list.push(durationMinutes);
    durationsByStrategy.set(strategy, list);
  }

  const overallMean = mean(allDurations);
  const findings: PatternFinding[] = [];

  for (const [strategy, durations] of durationsByStrategy) {
    if (durations.length < MIN_ASSOCIATION_OCCURRENCES) continue;
    const strategyMean = mean(durations);
    if (strategyMean >= overallMean * 0.75) continue; // not meaningfully faster

    findings.push({
      kind: "recovery_speed",
      title: `Recovery appears faster with "${capitalize(strategy)}"`,
      description: `Episodes where a caregiver logged "${strategy}" recovered in about ${Math.round(strategyMean)} minutes on average, versus ${Math.round(overallMean)} minutes across all recorded episodes (based on ${durations.length} episodes with this strategy).`,
      evidenceCount: durations.length,
      sampleSize: closed.length,
    });
  }

  return findings.sort((a, b) => b.evidenceCount - a.evidenceCount);
}

export async function discoverPatterns(supabase: Client, careProfileId: string): Promise<PatternFinding[]> {
  const events = await fetchRecentEvents(supabase, careProfileId);
  const observations = await fetchObservationsForEvents(
    supabase,
    events.map((e) => e.id)
  );
  const totalDays = await countDistinctDaysWithData(supabase, careProfileId);

  const observationsByEvent = new Map<string, ObservationRow[]>();
  for (const obs of observations) {
    if (!obs.event_id) continue;
    const list = observationsByEvent.get(obs.event_id) ?? [];
    list.push(obs);
    observationsByEvent.set(obs.event_id, list);
  }

  return [
    ...timeOfDayFindings(events, observationsByEvent, totalDays),
    ...contextAssociationFindings(observationsByEvent),
    ...recoverySpeedFindings(events, observationsByEvent),
  ];
}

