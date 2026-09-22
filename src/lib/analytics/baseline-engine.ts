/**
 * Personal baseline engine — PROTOTYPE LOGIC, not a clinically validated
 * model. See docs/AI_SYSTEM.md and docs/ARCHITECTURE.md for the full
 * writeup; this file is the implementation, kept deliberately simple and
 * auditable so a judge (or a future engineer swapping in a real trained
 * model) can read it top to bottom in a few minutes.
 *
 * THE IDEA
 * Rather than compare everyone against population thresholds ("resting
 * heart rate over 100 = bad"), we compare each person only against their
 * OWN recent history. A rolling mean + standard deviation per metric,
 * computed from a trailing window of that person's own sensor_readings,
 * stands in for "what's typical for this specific person lately."
 *
 * WHY Z-SCORES
 * A z-score — (value - mean) / stddev — expresses "how many of this
 * person's own typical fluctuations away from normal is this reading?"
 * That's directly comparable across metrics with wildly different units
 * (BPM vs. µS vs. °C), which lets us combine them into one deviation score.
 *
 * WHY THIS IS NOT A DIAGNOSIS
 * A high deviation score means "this combination of signals is unusual for
 * this person relative to their own recent baseline." It says nothing about
 * WHY, and nothing about emotion, medical status, or cause. The UI and
 * Aura AI's prompt both enforce that framing — see docs/AI_SYSTEM.md
 * "Responsible AI guardrails."
 */
import type { CareProfileState, Metric } from "@/types/domain";

export interface MetricBaseline {
  mean: number;
  stddev: number;
  sampleCount: number;
}

export interface MetricSample {
  value: number;
  recordedAt: string | Date;
}

/** Trailing window used to compute a baseline. Longer = more stable, slower to adapt to real change. */
export const BASELINE_WINDOW_DAYS = 7;
/** Readings inside this many minutes of "now" are excluded from the baseline so a current spike can't dilute itself. */
export const BASELINE_EXCLUDE_RECENT_MINUTES = 20;
/** Minimum samples in the window before we trust a baseline enough to compare against. Below this: "insufficient data". */
export const MIN_BASELINE_SAMPLES = 12;

/** Rolling mean + population standard deviation for one metric's samples. Pure function — no I/O, easy to unit test. */
export function computeMetricBaseline(samples: number[]): MetricBaseline {
  const sampleCount = samples.length;
  if (sampleCount === 0) return { mean: 0, stddev: 0, sampleCount: 0 };

  const mean = samples.reduce((sum, v) => sum + v, 0) / sampleCount;
  const variance = samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / sampleCount;
  const stddev = Math.sqrt(variance);

  return { mean, stddev, sampleCount };
}

export interface MetricDeviation {
  value: number;
  baselineMean: number;
  baselineStddev: number;
  /** Percentage difference from baseline mean, e.g. +14 means "14% above baseline". */
  percentDeviation: number;
  /** Standard deviations from baseline mean. null when stddev is 0 (can't divide by zero — treated as "no meaningful variation seen yet"). */
  zScore: number | null;
}

export function computeMetricDeviation(value: number, baseline: MetricBaseline): MetricDeviation {
  const percentDeviation = baseline.mean !== 0 ? ((value - baseline.mean) / baseline.mean) * 100 : 0;
  const zScore = baseline.stddev > 0 ? (value - baseline.mean) / baseline.stddev : null;
  return {
    value,
    baselineMean: baseline.mean,
    baselineStddev: baseline.stddev,
    percentDeviation,
    zScore,
  };
}

/**
 * Weights used to combine per-metric z-scores into one overall deviation
 * score. These are a hand-picked, documented starting point (heart rate and
 * GSR are the most established arousal-adjacent physiological signals;
 * HRV moves in the OPPOSITE direction — lower HRV is associated with higher
 * arousal, hence the negative sign), NOT derived from any clinical study.
 * A real deployment would replace this whole function with a trained model;
 * the interface (per-metric z-scores in, one score out) would stay the same.
 */
const METRIC_WEIGHTS: Record<Metric, number> = {
  heart_rate: 0.3,
  gsr: 0.3,
  hrv: -0.2, // inverted: lower HRV contributes positively to elevation
  skin_temp: 0.1,
  activity_level: 0.1,
};

export interface OverallDeviation {
  score: number;
  perMetric: Partial<Record<Metric, MetricDeviation>>;
  /** How many metrics actually had both a current value and a usable baseline. */
  metricsUsed: number;
}

/**
 * Combines per-metric deviations into one `baselineDeviationScore`, roughly
 * on the same scale as a z-score (0 = exactly at baseline, 1+ = one typical
 * fluctuation beyond normal, 2+ = two, etc.), using only the metrics that
 * have both a current reading and a valid baseline. Weights are
 * renormalized over whatever subset is available so a missing sensor
 * (e.g. no skin_temp) doesn't silently zero out the score.
 */
export function computeOverallDeviationScore(
  current: Partial<Record<Metric, number | null | undefined>>,
  baselines: Partial<Record<Metric, MetricBaseline | null>>
): OverallDeviation {
  const perMetric: Partial<Record<Metric, MetricDeviation>> = {};
  let weightedSum = 0;
  let weightTotal = 0;

  for (const metric of Object.keys(METRIC_WEIGHTS) as Metric[]) {
    const value = current[metric];
    const baseline = baselines[metric];
    if (value == null || !baseline || baseline.sampleCount < MIN_BASELINE_SAMPLES || baseline.stddev === 0) continue;

    const deviation = computeMetricDeviation(value, baseline);
    perMetric[metric] = deviation;

    if (deviation.zScore == null) continue;
    const weight = Math.abs(METRIC_WEIGHTS[metric]);
    const signedZ = METRIC_WEIGHTS[metric] < 0 ? -deviation.zScore : deviation.zScore;
    weightedSum += weight * signedZ;
    weightTotal += weight;
  }

  const score = weightTotal > 0 ? weightedSum / weightTotal : 0;
  return { score, perMetric, metricsUsed: weightTotal > 0 ? Object.keys(perMetric).length : 0 };
}

// Score thresholds for bucketing into a display state. Deliberately coarse
// and documented rather than tuned against real clinical outcome data.
const MILD_THRESHOLD = 0.5;
const ELEVATED_THRESHOLD = 1.0;
const HIGH_THRESHOLD = 1.75;
/** How far a score must have fallen from an episode's recorded peak before we call it "recovering" rather than still-elevated. */
const RECOVERY_DROP_RATIO = 0.75;

export function bucketDeviationScore(score: number): Exclude<CareProfileState, "insufficient_data" | "recovering"> {
  const magnitude = Math.abs(score);
  if (magnitude >= HIGH_THRESHOLD) return "high_elevation";
  if (magnitude >= ELEVATED_THRESHOLD) return "elevated";
  if (magnitude >= MILD_THRESHOLD) return "mild_elevation";
  return "calm";
}

/**
 * Full state classification, including the "recovering" and
 * "insufficient_data" states that `bucketDeviationScore` alone can't express
 * (they depend on sample size and on an in-progress event's peak, not just
 * the instantaneous score).
 */
export function classifyState(params: {
  overallScore: number;
  metricsUsed: number;
  openEventPeakScore: number | null;
}): CareProfileState {
  if (params.metricsUsed === 0) return "insufficient_data";

  const bucket = bucketDeviationScore(params.overallScore);

  if (bucket !== "calm" && params.openEventPeakScore != null) {
    const droppedEnough = Math.abs(params.overallScore) < Math.abs(params.openEventPeakScore) * RECOVERY_DROP_RATIO;
    if (droppedEnough) return "recovering";
  }

  return bucket;
}
