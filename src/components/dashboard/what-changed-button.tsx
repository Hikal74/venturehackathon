"use client";

import { useState } from "react";
import { Sparkles, Activity, History, Link2, Lightbulb, Eye, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponseSection } from "@/components/shared/response-section";
import { SafetyNote } from "@/components/shared/safety-note";
import { LoadingSequence } from "@/components/shared/loading-sequence";
import type { WhatChangedResponse } from "@/lib/ai/response-schema";
import type { EvidenceKind } from "@/types/domain";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; response: WhatChangedResponse };

const SECTIONS: { key: keyof WhatChangedResponse; title: string; evidence: EvidenceKind; icon: LucideIcon }[] = [
  { key: "currentObservation", title: "Current observation", evidence: "calculated", icon: Activity },
  { key: "relevantContext", title: "Relevant context", evidence: "observed", icon: History },
  { key: "possibleAssociations", title: "Possible associations", evidence: "inferred", icon: Link2 },
  { key: "suggestedResponse", title: "Suggested response", evidence: "inferred", icon: Lightbulb },
  { key: "whatToWatch", title: "What to watch", evidence: "inferred", icon: Eye },
];

const LOADING_MESSAGES = [
  "Reviewing recent signals and history…",
  "Comparing against saved context…",
  "Preparing a plain-language explanation…",
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
            <DialogTitle className="gradient-text-ai flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> What Changed
            </DialogTitle>
          </DialogHeader>

          {state.status === "loading" && <LoadingSequence messages={LOADING_MESSAGES} className="py-6" />}

          {state.status === "error" && (
            <div className="flex gap-3 rounded-2xl bg-status-warning/10 p-4">
              <AlertTriangle className="h-4 w-4 shrink-0 text-status-warning" />
              <div className="flex flex-col gap-0.5 text-sm">
                <span className="font-medium text-foreground">Aura AI is temporarily unavailable</span>
                <span className="text-muted-foreground">{state.message}</span>
              </div>
            </div>
          )}

          {state.status === "success" && (
            <div className="flex flex-col gap-5">
              {SECTIONS.map((section) => (
                <ResponseSection key={section.key} icon={section.icon} title={section.title} evidence={section.evidence}>
                  {state.response[section.key]}
                </ResponseSection>
              ))}
              <SafetyNote>{state.response.confidenceAndLimitations}</SafetyNote>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
