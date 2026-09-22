"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Toggle-chip grid for presets (loud environments, headphones, ...) plus a
 * free-text field for entries specific to this individual. Used for both
 * "sensitivities/triggers" and "support strategies" — same interaction,
 * different vocabulary — so the two onboarding steps share one component.
 */
export function TagPicker({
  presets,
  value,
  onChange,
}: {
  presets: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [customText, setCustomText] = useState("");

  function toggle(label: string) {
    onChange(value.includes(label) ? value.filter((v) => v !== label) : [...value, label]);
  }

  function addCustom() {
    const trimmed = customText.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setCustomText("");
  }

  const customEntries = value.filter((v) => !presets.includes(v));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const selected = value.includes(preset);
          return (
            <button
              key={preset}
              type="button"
              onClick={() => toggle(preset)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:bg-accent"
              )}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {customEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customEntries.map((entry) => (
            <span
              key={entry}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-border bg-card px-3 py-1.5 text-sm"
            >
              {entry}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== entry))}
                aria-label={`Remove ${entry}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add something specific to this person…"
          className="max-w-xs"
        />
        <Button type="button" variant="outline" size="icon" onClick={addCustom} aria-label="Add">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
