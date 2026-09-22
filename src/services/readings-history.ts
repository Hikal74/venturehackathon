import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
type SensorReadingRow = Database["public"]["Tables"]["sensor_readings"]["Row"];

/** Recent readings for sparkline/trend charts. Bounded lookback + row cap keeps this cheap even on a heavily-seeded profile. */
export async function getRecentReadings(
  supabase: Client,
  careProfileId: string,
  hours = 24,
  limit = 60
): Promise<SensorReadingRow[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("sensor_readings")
    .select("*")
    .eq("care_profile_id", careProfileId)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to load recent readings: ${error.message}`);
  return data ?? [];
}
