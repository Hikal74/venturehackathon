/**
 * Standalone CLI to (re-)seed the deterministic ~7-day demo dataset for an
 * existing care profile. The onboarding wizard does the same thing for a
 * brand-new profile automatically (see the "Seed 7 days of demo data"
 * checkbox); this script exists for re-seeding after a "Delete My Data" or
 * refreshing an older demo profile before a repeat presentation, without
 * creating a whole new account.
 *
 * This is the one legitimate use of the service-role (admin) client in
 * this codebase — a trusted operator running a local script, not a web
 * request — see src/lib/supabase/admin.ts and docs/DATABASE.md.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-data.ts <careProfileId>
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in
 * .env.local (loaded below via dotenv, since this runs outside Next.js).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { seedDemoDataForCareProfile } from "../src/services/demo-seed";

config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  const careProfileId = process.argv[2];
  if (!careProfileId) {
    console.error("Usage: npx tsx scripts/seed-demo-data.ts <careProfileId>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: careProfile, error } = await supabase
    .from("care_profiles")
    .select("id, display_name")
    .eq("id", careProfileId)
    .maybeSingle();

  if (error || !careProfile) {
    console.error(`Care profile ${careProfileId} not found: ${error?.message ?? "no matching row"}`);
    process.exit(1);
  }

  console.log(`Seeding demo data for "${careProfile.display_name}" (${careProfile.id})...`);
  await seedDemoDataForCareProfile(supabase, careProfile.id);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
