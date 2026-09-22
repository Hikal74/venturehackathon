import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { getMostRecentConversation } from "@/services/ai-conversations";
import { getConversationMessages } from "@/services/ai-chat";
import { AuraChat } from "@/components/aura-ai/aura-chat";
import { isAiConfigured } from "@/lib/env";

export default async function AuraAiPage() {
  const { supabase, active } = await getSessionContext();
  if (!active) redirect("/onboarding");

  const conversation = await getMostRecentConversation(supabase, active.id);
  const messages = conversation ? await getConversationMessages(supabase, conversation.id) : [];

  const initialMessages = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    confidenceNote:
      m.structured_payload && typeof m.structured_payload === "object" && "confidenceAndLimitations" in m.structured_payload
        ? (m.structured_payload as Record<string, unknown>).confidenceAndLimitations
        : undefined,
  })) as { id: string; role: "user" | "assistant"; content: string; confidenceNote?: string | null }[];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aura AI</h1>
        <p className="text-sm text-muted-foreground">
          Grounded in {active.display_name}&apos;s own baseline, history, and saved strategies — not a generic
          chatbot.
        </p>
        {!isAiConfigured() && (
          <p className="mt-2 rounded-lg bg-status-warning/10 px-3 py-2 text-xs text-[#8a5a00]">
            Aura AI is not configured in this environment (no Gemini API key set). Chat will show an honest
            &quot;temporarily unavailable&quot; message until one is added.
          </p>
        )}
      </div>

      <AuraChat
        careProfileId={active.id}
        careProfileName={active.display_name}
        initialMessages={initialMessages}
        initialConversationId={conversation?.id ?? null}
      />
    </div>
  );
}
