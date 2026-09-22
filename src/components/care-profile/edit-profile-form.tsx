"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateCareProfileAction, type UpdateProfileActionState } from "@/app/care-profile/actions";
import type { CareProfileAgeRange } from "@/types/database";

const AGE_RANGES: { value: CareProfileAgeRange; label: string }[] = [
  { value: "child_5_9", label: "Child (5–9)" },
  { value: "preteen_10_12", label: "Preteen (10–12)" },
  { value: "teen_13_17", label: "Teen (13–17)" },
  { value: "adult_18_plus", label: "Adult (18+)" },
];

const initialState: UpdateProfileActionState = {};

export function EditProfileForm({
  careProfileId,
  displayName,
  ageRange,
  preferredLanguage,
}: {
  careProfileId: string;
  displayName: string;
  ageRange: CareProfileAgeRange | null;
  preferredLanguage: string;
}) {
  const action = updateCareProfileAction.bind(null, careProfileId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} maxLength={80} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Age range</Label>
        <input type="hidden" name="ageRange" value={ageRange ?? ""} id="ageRangeHidden" />
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="ageRangeRadio"
                value={option.value}
                defaultChecked={ageRange === option.value}
                className="peer sr-only"
                onChange={() => {
                  const hidden = document.getElementById("ageRangeHidden") as HTMLInputElement | null;
                  if (hidden) hidden.value = option.value;
                }}
              />
              <span
                className={cn(
                  "block rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  "peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background border-border bg-card hover:bg-accent"
                )}
              >
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="preferredLanguage">Preferred language</Label>
        <Input id="preferredLanguage" name="preferredLanguage" defaultValue={preferredLanguage} className="max-w-[200px]" />
      </div>

      {state.error && <p className="text-sm text-status-critical">{state.error}</p>}
      {state.success && <p className="text-sm text-status-good">Saved.</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
