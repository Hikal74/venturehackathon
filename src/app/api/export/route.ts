import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exportCareProfileData } from "@/services/export";

const paramsSchema = z.object({ careProfileId: z.string().uuid() });

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = paramsSchema.safeParse({ careProfileId: new URL(request.url).searchParams.get("careProfileId") });
  if (!parsed.success) return NextResponse.json({ error: "A valid careProfileId is required." }, { status: 400 });
  const { careProfileId } = parsed.data;

  try {
    const data = await exportCareProfileData(supabase, careProfileId);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="auralink-export-${careProfileId}.json"`,
      },
    });
  } catch (err) {
    console.error("Export failed:", err);
    return NextResponse.json({ error: "Could not export this profile's data." }, { status: 400 });
  }
}
