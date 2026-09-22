import { describe, expect, it } from "vitest";
import { mulberry32, gaussian } from "./seeded-random";

describe("mulberry32", () => {
  it("is deterministic for a fixed seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const sequenceA = Array.from({ length: 10 }, () => a());
    const sequenceB = Array.from({ length: 10 }, () => b());
    expect(sequenceA).toEqual(sequenceB);
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1)();
    const b = mulberry32(2)();
    expect(a).not.toBe(b);
  });

  it("stays within [0, 1)", () => {
    const rng = mulberry32(8675309);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("gaussian", () => {
  it("is deterministic for a fixed seed", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    expect(gaussian(a, 100, 10)).toBeCloseTo(gaussian(b, 100, 10), 10);
  });

  it("centers roughly on the given mean over many samples", () => {
    const rng = mulberry32(123);
    const samples = Array.from({ length: 5000 }, () => gaussian(rng, 50, 5));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeGreaterThan(48);
    expect(mean).toBeLessThan(52);
  });
});
