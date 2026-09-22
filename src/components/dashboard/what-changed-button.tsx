"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EvidenceTag } from "@/components/shared/evidence-tag";
import type { WhatChangedResponse } from "@/lib/ai/response-schema";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; response: WhatChangedResponse };

const SECTIONS: { key: keyof WhatChangedResponse; title: string; evidence: "calculated" | "inferred" | "observed" }[] = [
  { key: "currentObservation", title: "Current observation", evidence: "calculated" },
  { key: "relevantContext", title: "Relevant context", evidence: "observed" },
  { key: "possibleAssociations", title: "Possible associations", evidence: "inferred" },
  { key: "suggestedResponse", title: "Suggested response", evidence: "inferred" },
  { key: "whatToWatch", title: "What to watch", evidence: "inferred" },
];

export function WhatChangedButton({ careProfileId }: { careProfileId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ status: "idle" });

  async function run() {
    setOpen(true);
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/ai/what-changed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careProfileId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Something went wrong." });
        return;
      }
      setState({ status: "success", response: json.response });
    } catch {
      setState({ status: "error", message: "Could not reach Aura AI. Check your connection and try again." });
    }
  }

  return (
    <>
      <Button size="lg" onClick={run} className="gap-2">
        <Sparkles className="h-4 w-4" />
        What Changed?
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-status-recovering" /> What Changed
            </DialogTitle>
          </DialogHeader>

          {state.status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing recent signals and history…
            </div>
          )}

          {state.status === "error" && (
            <div className="clay-inset flex flex-col gap-1 p-4 text-sm">
              <span className="font-medium">Aura AI is temporarily unavailable</span>
              <span className="text-muted-foreground">{state.message}</span>
            </div>
          )}

          {state.status === "success" && (
            <div className="flex flex-col gap-4">
              {SECTIONS.map((section) => (
                <div key={section.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{section.title}</h3>
                    <EvidenceTag kind={section.evidence} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{state.response[section.key]}</p>
                </div>
              ))}
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Confidence & limitations: </span>
                  {state.response.confidenceAndLimitations}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
