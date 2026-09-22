"use server";

/**
 * Server Actions for authentication. These run only on the server, so the
 * Supabase calls here execute with the request's cookies (via
 * lib/supabase/server.ts) and never expose credentials to the client.
 *
 * Each action returns a small `{ error }` shape on failure instead of
 * throwing, so the calling form can render a friendly message. On success,
 * most actions call `redirect()`, which works by throwing a special
 * Next.js-internal exception — that's intentional, don't wrap these calls
 * in try/catch or the redirect will be swallowed.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import {
  loginSchema,
  signUpSchema,
  resetPasswordRequestSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";

export type AuthActionState = { error?: string; message?: string };

export async function signUpAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmations are disabled on the Supabase project, `session`
  // is already set and the user is signed in immediately.
  if (data.session) {
    redirect("/onboarding");
  }

  return { message: "Account created. Check your email to confirm your address before signing in." };
}

export async function loginAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message };
  }

  const next = (formData.get("next") as string) || "/dashboard";
  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
  });

  // Deliberately don't reveal whether the email exists — same message either way.
  if (error) {
    return { message: "If an account exists for that email, a reset link is on its way." };
  }

  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePasswordAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
