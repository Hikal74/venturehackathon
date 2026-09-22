import { describe, expect, it } from "vitest";
import { sensorReadingSchema } from "./sensor";

const validBase = {
  careProfileId: "123e4567-e89b-12d3-a456-426614174000",
  heartRate: 80,
  activityLevel: 20,
};

describe("sensorReadingSchema", () => {
  it("accepts a minimal valid packet and defaults source to simulator", () => {
    const result = sensorReadingSchema.parse(validBase);
    expect(result.source).toBe("simulator");
  });

  it("rejects a non-UUID care profile id", () => {
    const result = sensorReadingSchema.safeParse({ ...validBase, careProfileId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it.each([0, -10, 300, 500])("rejects an out-of-range heart rate: %i", (heartRate) => {
    const result = sensorReadingSchema.safeParse({ ...validBase, heartRate });
    expect(result.success).toBe(false);
  });

  it.each([-1, 101])("rejects an out-of-range activity level: %i", (activityLevel) => {
    const result = sensorReadingSchema.safeParse({ ...validBase, activityLevel });
    expect(result.success).toBe(false);
  });

  it("accepts optional metrics when present and in range", () => {
    const result = sensorReadingSchema.safeParse({ ...validBase, hrv: 50, gsr: 2.5, skinTemp: 36.8 });
    expect(result.success).toBe(true);
  });

  it("rejects a skin temperature outside plausible human range", () => {
    const result = sensorReadingSchema.safeParse({ ...validBase, skinTemp: 50 });
    expect(result.success).toBe(false);
  });
});
