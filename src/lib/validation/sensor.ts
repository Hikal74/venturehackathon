import { z } from "zod";

/**
 * Validation for POST /api/device/readings.
 *
 * This is the contract a real AuraLink wearable would also have to satisfy —
 * deliberately plain, physical units, no app-specific concepts. Range checks
 * mirror the CHECK constraints in the sensor_readings table so we reject bad
 * data before it reaches the database rather than relying on a 500 from a
 * failed constraint.
 */
export const sensorReadingSchema = z.object({
  careProfileId: z.string().uuid(),
  heartRate: z.number().finite().gt(0).lt(300),
  hrv: z.number().finite().gte(0).optional(),
  gsr: z.number().finite().gte(0).optional(),
  skinTemp: z.number().finite().gt(20).lt(45).optional(),
  activityLevel: z.number().finite().gte(0).lte(100),
  recordedAt: z.string().datetime().optional(),
  source: z.enum(["simulator", "device"]).default("simulator"),
});
export type SensorReadingInput = z.infer<typeof sensorReadingSchema>;
