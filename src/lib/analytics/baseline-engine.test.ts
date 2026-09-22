import { describe, expect, it } from "vitest";
import {
  bucketDeviationScore,
  classifyState,
  computeMetricBaseline,
  computeMetricDeviation,
  computeOverallDeviationScore,
  MIN_BASELINE_SAMPLES,
} from "./baseline-engine";

describe("computeMetricBaseline", () => {
  it("returns zeroed baseline for no samples", () => {
    expect(computeMetricBaseline([])).toEqual({ mean: 0, stddev: 0, sampleCount: 0 });
  });

  it("computes mean and population stddev", () => {
    const result = computeMetricBaseline([70, 72, 74, 76, 78]);
    expect(result.mean).toBeCloseTo(74, 5);
    expect(result.sampleCount).toBe(5);
    expect(result.stddev).toBeCloseTo(2.8284, 3);
  });

  it("has zero stddev for a constant series", () => {
    const result = computeMetricBaseline([80, 80, 80]);
    expect(result.stddev).toBe(0);
  });
});

describe("computeMetricDeviation", () => {
  it("computes percent deviation and z-score", () => {
    const deviation = computeMetricDeviation(92, { mean: 80, stddev: 5, sampleCount: 20 });
    expect(deviation.percentDeviation).toBeCloseTo(15, 5);
    expect(deviation.zScore).toBeCloseTo(2.4, 5);
  });

  it("returns a null z-score when baseline has no variation (avoids divide-by-zero)", () => {
    const deviation = computeMetricDeviation(90, { mean: 80, stddev: 0, sampleCount: 20 });
    expect(deviation.zScore).toBeNull();
  });
});

describe("computeOverallDeviationScore", () => {
  const baselineFor = (mean: number, stddev: number) => ({ mean, stddev, sampleCount: MIN_BASELINE_SAMPLES + 5 });

  it("returns a zero score with no usable metrics", () => {
    const result = computeOverallDeviationScore({}, {});
    expect(result.score).toBe(0);
    expect(result.metricsUsed).toBe(0);
  });

  it("ignores metrics below the minimum sample count", () => {
    const result = computeOverallDeviationScore(
      { heart_rate: 100 },
      { heart_rate: { mean: 80, stddev: 5, sampleCount: 3 } }
    );
    expect(result.metricsUsed).toBe(0);
  });

  it("produces a positive score when heart rate and GSR are elevated", () => {
    const result = computeOverallDeviationScore(
      { heart_rate: 100, gsr: 4 },
      { heart_rate: baselineFor(80, 5), gsr: baselineFor(2.5, 0.5) }
    );
    expect(result.score).toBeGreaterThan(1);
    expect(result.metricsUsed).toBe(2);
  });

  it("inverts HRV so a LOWER value contributes positively to elevation", () => {
    const result = computeOverallDeviationScore({ hrv: 30 }, { hrv: baselineFor(55, 6) });
    // hrv is well below baseline, and the weight is negative, so the
    // resulting overall score should still be positive ("more elevated").
    expect(result.score).toBeGreaterThan(0);
  });
});

describe("bucketDeviationScore", () => {
  it.each([
    [0, "calm"],
    [0.3, "calm"],
    [0.6, "mild_elevation"],
    [1.2, "elevated"],
    [-1.2, "elevated"], // magnitude-based, sign doesn't matter
    [2.0, "high_elevation"],
  ] as const)("scores %f as %s", (score, expected) => {
    expect(bucketDeviationScore(score)).toBe(expected);
  });
});

describe("classifyState", () => {
  it("returns insufficient_data when no metrics were usable", () => {
    expect(classifyState({ overallScore: 5, metricsUsed: 0, openEventPeakScore: null })).toBe("insufficient_data");
  });

  it("returns the raw bucket when there's no open event", () => {
    expect(classifyState({ overallScore: 1.2, metricsUsed: 2, openEventPeakScore: null })).toBe("elevated");
  });

  it("returns recovering when score has dropped well below an open event's peak", () => {
    expect(classifyState({ overallScore: 0.6, metricsUsed: 2, openEventPeakScore: 2.0 })).toBe("recovering");
  });

  it("does not call it recovering if the score hasn't dropped enough yet", () => {
    expect(classifyState({ overallScore: 1.9, metricsUsed: 2, openEventPeakScore: 2.0 })).toBe("high_elevation");
  });

  it("returns calm (not recovering) once fully back to baseline, even with an open event", () => {
    expect(classifyState({ overallScore: 0.1, metricsUsed: 2, openEventPeakScore: 2.0 })).toBe("calm");
  });
});
