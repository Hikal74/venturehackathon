import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportCareProfileData } from "@/services/export";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const careProfileId = new URL(request.url).searchParams.get("careProfileId");
  if (!careProfileId) return NextResponse.json({ error: "careProfileId is required." }, { status: 400 });

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
