import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort absolute origin of the current request, used to build email
 * redirect links (Supabase needs a full URL for "confirm your email" /
 * "reset your password" links). Reads the actual request host so it works
 * correctly on localhost, Vercel preview URLs, and production without any
 * per-environment config.
 */
export async function getSiteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
