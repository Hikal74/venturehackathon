"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_CARE_PROFILE_COOKIE } from "@/lib/care-profile/active";
import {
  createCareProfileFromOnboarding,
  deleteCareProfile,
  updateCareProfile,
} from "@/services/care-profiles";
import { createCareProfileSchema, updateCareProfileSchema } from "@/lib/validation/care-profile";
import { seedDemoDataForCareProfile } from "@/services/demo-seed";

export async function switchActiveCareProfileAction(formData: FormData) {
  const id = formData.get("careProfileId");
  if (typeof id === "string" && id.length > 0) {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_CARE_PROFILE_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  const next = (formData.get("next") as string) || "/dashboard";
  revalidatePath("/", "layout");
  redirect(next);
}

export type OnboardingActionState = { error?: string };

export async function completeOnboardingAction(
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const raw = formData.get("payload");
  if (typeof raw !== "string") return { error: "Missing onboarding data." };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { error: "Could not read onboarding data." };
  }

  const parsed = createCareProfileSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your entries and try again." };
  }

  try {
    const careProfile = await createCareProfileFromOnboarding(supabase, user.id, parsed.data);

    if (parsed.data.seedDemoBaseline) {
      await seedDemoDataForCareProfile(supabase, careProfile.id);
    }

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_CARE_PROFILE_COOKIE, careProfile.id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong creating the care profile." };
  }

  redirect("/dashboard");
}

export type UpdateProfileActionState = { error?: string; success?: boolean };

export async function updateCareProfileAction(
  careProfileId: string,
  _prev: UpdateProfileActionState,
  formData: FormData
): Promise<UpdateProfileActionState> {
  const supabase = await createClient();
  const parsed = updateCareProfileSchema.safeParse({
    displayName: formData.get("displayName") || undefined,
    ageRange: formData.get("ageRange") || undefined,
    preferredLanguage: formData.get("preferredLanguage") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your entries and try again." };
  }

  try {
    await updateCareProfile(supabase, careProfileId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update care profile." };
  }

  revalidatePath("/care-profile");
  return { success: true };
}

export async function deleteMyDataAction(formData: FormData) {
  const careProfileId = formData.get("careProfileId");
  if (typeof careProfileId !== "string") return;

  const supabase = await createClient();
  await deleteCareProfile(supabase, careProfileId);

  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_CARE_PROFILE_COOKIE);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
