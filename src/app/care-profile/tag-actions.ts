"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addTag, removeTag } from "@/services/tag-lists";

export async function addTriggerAction(formData: FormData) {
  const supabase = await createClient();
  const careProfileId = formData.get("careProfileId");
  const label = formData.get("label");
  if (typeof careProfileId === "string" && typeof label === "string") {
    await addTag(supabase, "triggers", careProfileId, label);
  }
  revalidatePath("/care-profile");
}

export async function removeTriggerAction(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id");
  if (typeof id === "string") await removeTag(supabase, "triggers", id);
  revalidatePath("/care-profile");
}

export async function addSupportStrategyAction(formData: FormData) {
  const supabase = await createClient();
  const careProfileId = formData.get("careProfileId");
  const label = formData.get("label");
  if (typeof careProfileId === "string" && typeof label === "string") {
    await addTag(supabase, "support_strategies", careProfileId, label);
  }
  revalidatePath("/care-profile");
}

export async function removeSupportStrategyAction(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id");
  if (typeof id === "string") await removeTag(supabase, "support_strategies", id);
  revalidatePath("/care-profile");
}
