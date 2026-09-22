"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TagPicker } from "./tag-picker";
import { completeOnboardingAction, type OnboardingActionState } from "@/app/care-profile/actions";
import type { CreateCareProfileInput } from "@/lib/validation/care-profile";
import type { CareProfileAgeRange } from "@/types/database";

const TRIGGER_PRESETS = [
  "Loud environments",
  "Crowds",
  "Unexpected routine changes",
  "Bright lights",
  "Touch",
  "Unfamiliar environments",
];

const STRATEGY_PRESETS = [
  "Quiet environment",
  "Headphones",
  "Familiar object",
  "Reduced sensory stimulation",
  "Short break",
  "Caregiver presence",
];

const AGE_RANGES: { value: CareProfileAgeRange; label: string }[] = [
  { value: "child_5_9", label: "Child (5–9)" },
  { value: "preteen_10_12", label: "Preteen (10–12)" },
  { value: "teen_13_17", label: "Teen (13–17)" },
  { value: "adult_18_plus", label: "Adult (18+)" },
];

const STEP_TITLES = [
  "Basic profile",
  "Sensitivities & triggers",
  "Support strategies",
  "Typical routine",
  "Baseline setup",
];

const initialState: OnboardingActionState = {};

export function OnboardingWizard({ suggestedName }: { suggestedName?: string }) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);

  const [form, setForm] = useState<CreateCareProfileInput>({
    displayName: suggestedName ?? "",
    ageRange: undefined,
    preferredLanguage: "en",
    communicationPreferences: {},
    triggers: [],
    supportStrategies: [],
    routine: {},
    routineNotes: "",
    seedDemoBaseline: true,
  });

  const payload = useMemo(() => JSON.stringify(form), [form]);

  function patch<K extends keyof CreateCareProfileInput>(key: K, value: CreateCareProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canAdvance = step !== 0 || form.displayName.trim().length > 0;
  const isLastStep = step === STEP_TITLES.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {step + 1} of {STEP_TITLES.length}
          </span>
          <span>{STEP_TITLES[step]}</span>
        </div>
        <Progress value={((step + 1) / STEP_TITLES.length) * 100} />
      </div>

      <form action={formAction} className="clay flex flex-col gap-6 p-6">
        <input type="hidden" name="payload" value={payload} />

        {step === 0 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-semibold">Who is this profile for?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This is the person AuraLink will help you understand — not your own account details.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => patch("displayName", e.target.value)}
                placeholder="e.g. Alex"
                maxLength={80}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Age range</Label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => patch("ageRange", option.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                      form.ageRange === option.value
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:bg-accent"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="preferredLanguage">Preferred language</Label>
              <Input
                id="preferredLanguage"
                value={form.preferredLanguage}
                onChange={(e) => patch("preferredLanguage", e.target.value)}
                className="max-w-[200px]"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label>Communication preferences</Label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(form.communicationPreferences.verbal)}
                  onCheckedChange={(checked) =>
                    patch("communicationPreferences", { ...form.communicationPreferences, verbal: Boolean(checked) })
                  }
                />
                Primarily verbal communication
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(form.communicationPreferences.usesAAC)}
                  onCheckedChange={(checked) =>
                    patch("communicationPreferences", { ...form.communicationPreferences, usesAAC: Boolean(checked) })
                  }
                />
                Uses AAC / a communication device
              </label>
              <Textarea
                placeholder="Anything else about how they communicate (optional)"
                value={form.communicationPreferences.notes ?? ""}
                onChange={(e) =>
                  patch("communicationPreferences", { ...form.communicationPreferences, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold">Known sensitivities</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                These are preferences you&apos;ve noticed for this specific person — not a universal or medical
                list. Select any that apply, or add your own.
              </p>
            </div>
            <TagPicker presets={TRIGGER_PRESETS} value={form.triggers} onChange={(v) => patch("triggers", v)} />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold">Known support strategies</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                What has helped this person before? Aura AI will prioritize these when suggesting a response.
              </p>
            </div>
            <TagPicker
              presets={STRATEGY_PRESETS}
              value={form.supportStrategies}
              onChange={(v) => patch("supportStrategies", v)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold">Typical routine</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Optional context that helps interpret when signals change. Skip anything that doesn&apos;t apply.
              </p>
            </div>
            {(["school", "home", "therapy", "transportation", "meals", "sleep"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={key} className="capitalize">
                  {key}
                </Label>
                <Input
                  id={key}
                  value={form.routine[key] ?? ""}
                  onChange={(e) => patch("routine", { ...form.routine, [key]: e.target.value })}
                  placeholder={`e.g. ${routinePlaceholder(key)}`}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="routineNotes">Anything else</Label>
              <Textarea
                id="routineNotes"
                value={form.routineNotes}
                onChange={(e) => patch("routineNotes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold">Baseline setup</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                AuraLink learns what&apos;s typical for this person by watching signals over time — there&apos;s no
                universal &quot;normal&quot; it compares everyone against. A new profile needs a few days of
                readings before comparisons become meaningful.
              </p>
            </div>
            <div className="clay-inset flex items-start gap-3 p-4">
              <Checkbox
                id="seedDemoBaseline"
                checked={form.seedDemoBaseline}
                onCheckedChange={(checked) => patch("seedDemoBaseline", Boolean(checked))}
              />
              <label htmlFor="seedDemoBaseline" className="text-sm leading-relaxed">
                <span className="font-medium">Seed 7 days of demo data</span> for this profile — realistic,
                clearly-labeled simulated readings, events, and observations so you can explore the dashboard,
                Patterns, and Aura AI immediately. You can still send live simulator readings on top of this.
              </label>
            </div>
          </div>
        )}

        {state.error && (
          <p role="alert" className="text-sm text-status-critical">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || pending}
          >
            Back
          </Button>

          {isLastStep ? (
            <Button type="submit" disabled={pending}>
              {pending ? "Creating profile…" : "Finish setup"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1))}
              disabled={!canAdvance}
            >
              Continue
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function routinePlaceholder(key: string): string {
  switch (key) {
    case "school":
      return "Mainstream classroom, mornings only";
    case "home":
      return "Lives with two siblings";
    case "therapy":
      return "OT on Tuesdays";
    case "transportation":
      return "School bus, ~20 minutes";
    case "meals":
      return "Prefers a consistent routine";
    case "sleep":
      return "Bedtime around 9pm";
    default:
      return "";
  }
}
