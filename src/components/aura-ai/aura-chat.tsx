"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EvidenceTag } from "@/components/shared/evidence-tag";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidenceNote?: string | null;
  pending?: boolean;
  error?: boolean;
}

export function AuraChat({
  careProfileId,
  careProfileName,
  initialMessages,
  initialConversationId,
}: {
  careProfileId: string;
  careProfileName: string;
  initialMessages: ChatMessage[];
  initialConversationId: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careProfileId, message: text, conversationId }),
      });
      const json = await res.json();

      if (json.conversationId) setConversationId(json.conversationId);

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: json.error ?? "Aura AI is temporarily unavailable.", error: true },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: json.reply, confidenceNote: json.confidenceNote },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Network error — could not reach Aura AI.", error: true },
      ]);
    } finally {
      setSending(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setConversationId(null);
    router.refresh();
  }

  return (
    <div className="clay flex h-[70vh] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-status-recovering" />
          <div>
            <h2 className="text-sm font-semibold">Aura AI</h2>
            <p className="text-xs text-muted-foreground">Answering about {careProfileName}&apos;s profile</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={newConversation} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New chat
        </Button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
            <p>Ask Aura AI about {careProfileName}&apos;s recent signals, history, or known strategies.</p>
            <p className="text-xs">It only knows what&apos;s in this profile&apos;s own record — it won&apos;t guess.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-foreground text-background"
                      : m.error
                        ? "bg-status-critical/10 text-status-critical"
                        : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {m.content}
                </div>
                {m.confidenceNote && (
                  <div className="flex max-w-[85%] items-start gap-1.5 px-1">
                    <EvidenceTag kind="inferred" />
                    <span className="text-xs text-muted-foreground">{m.confidenceNote}</span>
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask about recent signals, history, or strategies…"
          rows={1}
          className="max-h-32 flex-1 resize-none"
        />
        <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
