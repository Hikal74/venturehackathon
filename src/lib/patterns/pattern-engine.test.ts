import { describe, expect, it } from "vitest";
import { mostCommon, mean, capitalize } from "./pattern-utils";

describe("mostCommon", () => {
  it("returns null when nothing repeats at least twice", () => {
    expect(mostCommon(["a", "b", "c"])).toBeNull();
  });

  it("returns the most frequent value once it appears at least twice", () => {
    expect(mostCommon(["a", "b", "a", "c", "a"])).toBe("a");
  });

  it("ignores nulls", () => {
    expect(mostCommon([null, "x", null, "x", null])).toBe("x");
  });
});

describe("mean", () => {
  it("returns 0 for an empty array", () => {
    expect(mean([])).toBe(0);
  });

  it("computes the arithmetic mean", () => {
    expect(mean([10, 20, 30])).toBe(20);
  });
});

describe("capitalize", () => {
  it("capitalizes only the first letter", () => {
    expect(capitalize("crowded cafeteria")).toBe("Crowded cafeteria");
  });
});
