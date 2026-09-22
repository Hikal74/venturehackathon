/**
 * Centralized, validated access to environment variables.
 *
 * Why this exists: every secret in this app (Supabase service role key,
 * Gemini API key) must never reach client-side JavaScript. By validating
 * env vars in one server-only module and importing from here instead of
 * calling `process.env.X` directly everywhere, we get:
 *   1. A single place that documents every required var.
 *   2. A fast, clear failure at startup if something is missing, instead of
 *      a confusing runtime error deep in a request handler.
 *   3. A guard against accidentally importing server secrets into a
 *      "use client" file (see the `import "server-only"` below).
 */
import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.6-flash"),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Returns validated server-side environment variables. Throws a descriptive
 * error (not a stack trace judges/users would see) if something required is
 * missing or malformed. Call this from server code (API routes, server
 * components, services) — never from a "use client" component.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(
      `Missing or invalid environment variables.\n${issues}\n\nCopy .env.local.example to .env.local and fill in real values.`
    );
  }

  cached = parsed.data;
  return cached;
}

/** True when a Gemini API key is configured. Used to drive Aura AI's honest "unavailable" fallback state. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Client-safe public env vars. These are intentionally the only two values exposed to the browser. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};
