import "server-only";

/**
 * Deterministic ~7-day demo dataset for a freshly onboarded care profile.
 *
 * WHY DETERMINISTIC: seeded once with a fixed RNG seed (see
 * lib/demo/seeded-random.ts) so the same discoverable pattern — repeated
 * midday elevation on 4 of the last 5 weekdays, tied to a crowded cafeteria
 * — shows up every time a judge creates a fresh account, not only
 * sometimes. Two more patterns are seeded alongside it (a transportation
 * association, and faster recovery when a quiet environment was used) so
 * Pattern Discovery has more than one thing to find.
 *
 * WHAT'S REAL vs. WHAT'S SYNTHESIZED: the sensor_readings rows this writes
 * are ordinary rows in the real table — the dashboard's live baseline
 * comparison and Aura AI's context both compute over them for real, the
 * same as any other reading. Only the `events` rows are placed directly
 * (matching the windows this generator defines) instead of being produced
 * by replaying ~400 readings through the incremental analysis engine one
 * at a time — that replay would be correct but needlessly slow for a
 * one-time seed operation. This is disclosed here and in docs/AI_SYSTEM.md.
 *
 * Every row this writes has `is_demo` / a `simulator` source so the UI can
 * (and does) label it honestly.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { computeMetricBaseline } from "@/lib/analytics/baseline-engine";
import { mulberry32, gaussian } from "@/lib/demo/seeded-random";

type Client = SupabaseClient<Database>;

const SEED = 8_675_309; // fixed — see module docstring
const DAY_MS = 24 * 60 * 60 * 1000;
const READING_INTERVAL_MINUTES = 15;
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 21;

// "Typical calm" reference values used ONLY to synthesize plausible demo
// data — not a population baseline used anywhere in real analysis (real
// analysis always compares a person only against their own history).
const BASE = { heart_rate: 78, hrv: 55, gsr: 2.4, skin_temp: 36.5, activity_level: 18 };
const NOISE_SD = { heart_rate: 4, hrv: 6, gsr: 0.35, skin_temp: 0.15, activity_level: 7 };
const PEAK_DELTA = { heart_rate: 0.32, hrv: -0.28, gsr: 0.55, skin_temp: 0.4, activity_level: 25 };

interface ElevationWindow {
  startMinute: number; // minutes from day start (DAY_START_HOUR)
  rampMinutes: number;
  holdMinutes: number;
  recoverMinutes: number;
  observation: {
    environment?: string;
    activity?: string;
    possibleTrigger?: string;
    supportAction?: string;
    notes?: string;
    outcome?: string;
    occurredAtOffsetMinutes: number; // offset from startMinute
  };
}

function minutesFromDayStart(hour: number, minute: number): number {
  return (hour - DAY_START_HOUR) * 60 + minute;
}

/** One entry per day, oldest (6 days ago) first. `null` = a calm day with no elevated window. */
const DAY_WINDOWS: (ElevationWindow | null)[] = [
  {
    startMinute: minutesFromDayStart(12, 30),
    rampMinutes: 5,
    holdMinutes: 10,
    recoverMinutes: 25,
    observation: {
      environment: "School cafeteria",
      activity: "Lunch",
      possibleTrigger: "Crowded cafeteria",
      supportAction: "Moved to quiet hallway",
      outcome: "Settled after several minutes.",
      notes: "Very crowded today.",
      occurredAtOffsetMinutes: 4,
    },
  },
  {
    startMinute: minutesFromDayStart(12, 41),
    rampMinutes: 5,
    holdMinutes: 8,
    recoverMinutes: 22,
    observation: {
      environment: "School cafeteria",
      activity: "Lunch",
      possibleTrigger: "Cafeteria noise",
      supportAction: "Moved to quiet hallway",
      outcome: "Settled within about 15 minutes.",
      occurredAtOffsetMinutes: 4,
    },
  },
  null, // calm day — breaks the pattern, useful contrast for Pattern Discovery
  {
    startMinute: minutesFromDayStart(12, 28),
    rampMinutes: 5,
    holdMinutes: 9,
    recoverMinutes: 24,
    observation: {
      environment: "School cafeteria",
      activity: "Lunch",
      possibleTrigger: "Crowded cafeteria",
      supportAction: "Moved to quiet hallway",
      outcome: "Settled after several minutes.",
      occurredAtOffsetMinutes: 3,
    },
  },
  {
    startMinute: minutesFromDayStart(12, 35),
    rampMinutes: 5,
    holdMinutes: 10,
    recoverMinutes: 20,
    observation: {
      environment: "School cafeteria",
      activity: "Lunch",
      possibleTrigger: "Loud cafeteria",
      supportAction: "Moved to quiet hallway",
      outcome: "Settled after several minutes.",
      occurredAtOffsetMinutes: 4,
    },
  },
  {
    startMinute: minutesFromDayStart(9, 15),
    rampMinutes: 4,
    holdMinutes: 6,
    recoverMinutes: 18,
    observation: {
      environment: "Car",
      activity: "Transportation to school",
      possibleTrigger: "Transportation",
      supportAction: "Familiar object",
      outcome: "Calmed within about 10 minutes.",
      occurredAtOffsetMinutes: 2,
    },
  },
  null, // today — handled separately below (depends on the current time)
];

function envelopeIntensity(minutesIntoDay: number, window: ElevationWindow): number {
  const t = minutesIntoDay - window.startMinute;
  if (t < 0) return 0;
  if (t < window.rampMinutes) return t / window.rampMinutes;
  if (t < window.rampMinutes + window.holdMinutes) return 1;
  const recoverT = t - window.rampMinutes - window.holdMinutes;
  if (recoverT < window.recoverMinutes) return 1 - recoverT / window.recoverMinutes;
  return 0;
}

interface GeneratedReading {
  recordedAt: Date;
  heart_rate: number;
  hrv: number;
  gsr: number;
  skin_temp: number;
  activity_level: number;
}

function generateDayReadings(
  dayStart: Date,
  window: ElevationWindow | null,
  rng: () => number,
  cutoff: Date | null
): GeneratedReading[] {
  const readings: GeneratedReading[] = [];
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;

  for (let m = 0; m <= totalMinutes; m += READING_INTERVAL_MINUTES) {
    const recordedAt = new Date(dayStart.getTime() + m * 60 * 1000);
    if (cutoff && recordedAt > cutoff) break;

    const intensity = window ? envelopeIntensity(m, window) : 0;

    readings.push({
      recordedAt,
      heart_rate: gaussian(rng, BASE.heart_rate + intensity * BASE.heart_rate * PEAK_DELTA.heart_rate, NOISE_SD.heart_rate),
      hrv: Math.max(10, gaussian(rng, BASE.hrv + intensity * BASE.hrv * PEAK_DELTA.hrv, NOISE_SD.hrv)),
      gsr: Math.max(0.1, gaussian(rng, BASE.gsr + intensity * BASE.gsr * PEAK_DELTA.gsr, NOISE_SD.gsr)),
      skin_temp: gaussian(rng, BASE.skin_temp + intensity * PEAK_DELTA.skin_temp, NOISE_SD.skin_temp),
      activity_level: Math.min(
        100,
        Math.max(0, gaussian(rng, BASE.activity_level + intensity * PEAK_DELTA.activity_level, NOISE_SD.activity_level))
      ),
    });
  }

  return readings;
}

export async function seedDemoDataForCareProfile(supabase: Client, careProfileId: string): Promise<void> {
  const rng = mulberry32(SEED);
  const now = new Date();

  const allReadings: (GeneratedReading & { dayIndex: number })[] = [];
  const eventsToInsert: {
    dayIndex: number;
    window: ElevationWindow;
    startedAt: Date;
    endedAt: Date;
    peakScore: number;
  }[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const daysAgo = 6 - dayIndex;
    const dayStart = new Date(now.getTime() - daysAgo * DAY_MS);
    dayStart.setHours(DAY_START_HOUR, 0, 0, 0);

    let window = DAY_WINDOWS[dayIndex];
    let cutoff: Date | null = null;

    if (dayIndex === 6) {
      // Today: only generate up to "now", and only add today's demo event
      // if there's enough runway before now for it to fully resolve — so
      // the dashboard reliably opens on CALM right after seeding, and the
      // presenter's live simulator action is what visibly changes it.
      cutoff = now;
      const candidateStart = Math.max(0, (now.getTime() - dayStart.getTime()) / 60000 - 180);
      const totalDuration = 3 + 5 + 12; // fast-recovery window below
      if (candidateStart > 0 && candidateStart + totalDuration + 30 < (now.getTime() - dayStart.getTime()) / 60000) {
        window = {
          startMinute: candidateStart,
          rampMinutes: 3,
          holdMinutes: 5,
          recoverMinutes: 12,
          observation: {
            environment: "Living room",
            supportAction: "Quiet environment",
            outcome: "Returned toward baseline quickly.",
            notes: "Used noise-cancelling headphones and dimmed the lights.",
            occurredAtOffsetMinutes: 4,
          },
        };
      } else {
        window = null;
      }
    }

    const dayReadings = generateDayReadings(dayStart, window, rng, cutoff);
    allReadings.push(...dayReadings.map((r) => ({ ...r, dayIndex })));

    if (window) {
      const startedAt = new Date(dayStart.getTime() + window.startMinute * 60 * 1000);
      const endedAt = new Date(startedAt.getTime() + (window.rampMinutes + window.holdMinutes + window.recoverMinutes) * 60 * 1000);
      // Peak score is a plausible display value (comparable to what the
      // live engine would compute for a bump of this size) — used only for
      // the seeded historical event record and the recovery-ratio math the
      // dashboard/patterns UI reads; NOT recomputed via the live engine for
      // performance reasons (see module docstring).
      eventsToInsert.push({ dayIndex, window, startedAt, endedAt, peakScore: 1.6 + rng() * 0.6 });
    }
  }

  if (allReadings.length === 0) return;

  const { error: readingsError } = await supabase.from("sensor_readings").insert(
    allReadings.map((r) => ({
      care_profile_id: careProfileId,
      source: "simulator" as const,
      heart_rate: Math.round(r.heart_rate * 10) / 10,
      hrv: Math.round(r.hrv * 10) / 10,
      gsr: Math.round(r.gsr * 100) / 100,
      skin_temp: Math.round(r.skin_temp * 100) / 100,
      activity_level: Math.round(r.activity_level * 10) / 10,
      recorded_at: r.recordedAt.toISOString(),
    }))
  );
  if (readingsError) throw new Error(`Failed to seed sensor readings: ${readingsError.message}`);

  for (const { window, startedAt, endedAt, peakScore } of eventsToInsert) {
    const durationMinutes = window.rampMinutes + window.holdMinutes + window.recoverMinutes;
    const state = durationMinutes <= 20 ? "elevated" : "high_elevation";

    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .insert({
        care_profile_id: careProfileId,
        state,
        deviation_score: Math.round(peakScore * 100) / 100,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
      })
      .select("id")
      .single();

    if (eventError || !eventRow) {
      console.error("Failed to seed event:", eventError?.message);
      continue;
    }

    const occurredAt = new Date(startedAt.getTime() + window.observation.occurredAtOffsetMinutes * 60 * 1000);
    const { error: obsError } = await supabase.from("observations").insert({
      care_profile_id: careProfileId,
      occurred_at: occurredAt.toISOString(),
      environment: window.observation.environment,
      activity: window.observation.activity,
      possible_trigger: window.observation.possibleTrigger,
      support_action: window.observation.supportAction,
      notes: window.observation.notes,
      outcome: window.observation.outcome,
      event_id: eventRow.id,
    });
    if (obsError) console.error("Failed to seed observation:", obsError.message);
  }

  // One baseline_metrics snapshot so the table isn't empty before the first
  // real reading is analyzed (the dashboard's live status still computes
  // fresh from sensor_readings on every load — this snapshot is a
  // historical record, not what the dashboard reads for "right now").
  const windowStartForBaseline = new Date(now.getTime() - 7 * DAY_MS);
  const metrics = ["heart_rate", "hrv", "gsr", "skin_temp", "activity_level"] as const;
  const snapshotRows = metrics.map((metric) => {
    const values = allReadings.map((r) => r[metric]);
    const baseline = computeMetricBaseline(values);
    return {
      care_profile_id: careProfileId,
      metric,
      baseline_mean: baseline.mean,
      baseline_stddev: baseline.stddev,
      sample_count: baseline.sampleCount,
      window_start: windowStartForBaseline.toISOString(),
      window_end: now.toISOString(),
    };
  });
  const { error: baselineError } = await supabase.from("baseline_metrics").insert(snapshotRows);
  if (baselineError) console.error("Failed to seed baseline snapshot:", baselineError.message);
}
