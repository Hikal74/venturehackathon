import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendChatMessage } from "@/services/ai-chat";

const bodySchema = z.object({
  careProfileId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  try {
    const result = await sendChatMessage(
      supabase,
      parsed.data.careProfileId,
      user.id,
      parsed.data.message,
      parsed.data.conversationId
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.reason, conversationId: result.conversationId }, { status: 503 });
    }

    return NextResponse.json({
      reply: result.reply,
      confidenceNote: result.confidenceNote,
      conversationId: result.conversationId,
    });
  } catch (err) {
    console.error("Aura AI chat failed:", err);
    return NextResponse.json({ error: "Could not reach Aura AI for this profile." }, { status: 400 });
  }
}
