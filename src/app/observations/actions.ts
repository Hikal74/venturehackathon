"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createObservation } from "@/services/observations";
import { createObservationSchema } from "@/lib/validation/observation";

export type ObservationActionState = { error?: string; success?: boolean };

export async function createObservationAction(
  _prev: ObservationActionState,
  formData: FormData
): Promise<ObservationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const parsed = createObservationSchema.safeParse({
    careProfileId: formData.get("careProfileId"),
    occurredAt: formData.get("occurredAt") || undefined,
    environment: formData.get("environment") || undefined,
    activity: formData.get("activity") || undefined,
    possibleTrigger: formData.get("possibleTrigger") || undefined,
    supportAction: formData.get("supportAction") || undefined,
    notes: formData.get("notes") || undefined,
    outcome: formData.get("outcome") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  try {
    await createObservation(supabase, user.id, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save observation." };
  }

  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  return { success: true };
}
