import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sensorReadingSchema } from "@/lib/validation/sensor";
import { ingestSensorReading } from "@/services/sensor-ingestion";

/**
 * POST /api/device/readings
 *
 * This is the contract a real AuraLink wearable's gateway would call — the
 * Device Simulator in the caregiver app calls the exact same endpoint. The
 * body shape and validation are deliberately hardware-agnostic (see
 * lib/validation/sensor.ts).
 *
 * AUTH TODAY vs. FUTURE: this endpoint currently authenticates via the
 * caller's Supabase session cookie (the simulator runs inside the logged-in
 * caregiver's browser), then checks that session has *edit* access to the
 * target care profile — the same Row Level Security every other write in
 * the app goes through. A physical wearable has no browser session, so a
 * production version would add a separate per-device credential (e.g. a
 * long-lived device token minted per care profile) checked here instead of
 * a cookie; everything below this auth check — validation, persistence,
 * analysis — would be unchanged. That's intentionally the only piece that
 * would need to grow.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = sensorReadingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid sensor packet.", issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const result = await ingestSensorReading(supabase, parsed.data);
    return NextResponse.json({
      reading: result.latestReading,
      state: result.state,
      deviationScore: result.deviation.score,
      event: result.openEvent,
    });
  } catch (err) {
    // RLS will make the insert itself fail (as a Postgres permission error)
    // if this user doesn't have edit access to careProfileId, so we don't
    // need a separate authorization check here — but we do translate the
    // failure into a message that doesn't leak internals.
    console.error("Sensor ingestion failed:", err);
    return NextResponse.json({ error: "Could not store sensor reading. Check the care profile ID." }, { status: 400 });
  }
}
