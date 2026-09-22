import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runWhatChanged } from "@/services/ai-what-changed";

const bodySchema = z.object({ careProfileId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A care profile ID is required." }, { status: 400 });

  // No separate authorization check needed here: buildAuraAiContext's very
  // first query (`care_profiles` by id) runs through the RLS-scoped client
  // and returns nothing for a profile this user can't access, which
  // surfaces as a clean error below rather than leaking any data.
  try {
    const result = await runWhatChanged(supabase, parsed.data.careProfileId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 503 });
    }
    return NextResponse.json({ response: result.response, generatedAt: result.generatedAt });
  } catch (err) {
    console.error("What Changed failed:", err);
    return NextResponse.json({ error: "Could not analyze this profile right now." }, { status: 400 });
  }
}
