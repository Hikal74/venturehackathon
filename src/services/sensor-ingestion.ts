import "server-only";

/**
 * The single path ANY sensor reading takes into the system — whether it
 * comes from the Device Simulator today or a real AuraLink wearable
 * tomorrow. Both would call this with the same shape; only `source`
 * differs. This is what makes "swap in real hardware later" true instead
 * of aspirational: there's exactly one ingestion function, and it already
 * doesn't care where the reading came from.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SensorReadingInput } from "@/lib/validation/sensor";
import { analyzeAndPersist, type StatusResult } from "@/lib/analytics/analysis-engine";

type Client = SupabaseClient<Database>;

export async function ingestSensorReading(
  supabase: Client,
  input: SensorReadingInput
): Promise<StatusResult & { eventChanged: boolean }> {
  const { data: reading, error } = await supabase
    .from("sensor_readings")
    .insert({
      care_profile_id: input.careProfileId,
      source: input.source,
      heart_rate: input.heartRate,
      hrv: input.hrv,
      gsr: input.gsr,
      skin_temp: input.skinTemp,
      activity_level: input.activityLevel,
      recorded_at: input.recordedAt ?? new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !reading) {
    throw new Error(`Failed to store sensor reading: ${error?.message}`);
  }

  return analyzeAndPersist(supabase, input.careProfileId, reading);
}
