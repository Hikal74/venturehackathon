/**
 * Centralized, validated access to environment variables.
 *
 * Why this exists: every secret in this app (Supabase URL/keys, Gemini API
 * key) must never reach client-side JavaScript. By validating env vars in
 * one server-only module and importing from here instead of calling
 * `process.env.X` directly everywhere, we get:
 *   1. A single place that documents every required var.
 *   2. A fast, clear failure at startup if something is missing, instead of
 *      a confusing runtime error deep in a request handler.
 *   3. A guard against accidentally importing server secrets into a
 *      "use client" file (see the `import "server-only"` below).
 *
 * Naming note: these are plain `SUPABASE_URL`/`SUPABASE_ANON_KEY`, not
 * `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`. This app has
 * no browser-side Supabase client — every read/write goes through Server
 * Components or Server Actions (see lib/supabase/server.ts) — so nothing
 * here ever needs to be inlined into client-side JavaScript. Using the
 * `NEXT_PUBLIC_` prefix would be actively wrong: it's a signal to Next.js
 * to bundle the value into browser code, which conflicts with marking it
 * "Sensitive" in a host like Vercel and buys this app nothing since no
 * client code reads it. If a real-time feature is ever added that needs a
 * browser Supabase client, reintroduce a `NEXT_PUBLIC_`-prefixed pair
 * specifically for that (the anon key is safe to expose either way — it's
 * constrained by Row Level Security, not secrecy — but there's no reason
 * to expose it before something actually needs it).
 */
import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url({
    message: "SUPABASE_URL must be a valid Supabase project URL",
  }),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
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
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
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
