/**
 * Session-refresh proxy (Next.js 16 renamed `middleware.ts`/`middleware()` to
 * `proxy.ts`/`proxy()` — same mechanism, new name, and it now always runs on
 * the Node.js runtime).
 *
 * Why this file exists: Supabase auth tokens are short-lived and stored in
 * cookies. Server Components can READ cookies but often can't WRITE them
 * (React forbids setting cookies during render). If nothing refreshes the
 * session cookie on the way in, users get logged out randomly whenever the
 * access token expires mid-session. This proxy runs before every matched
 * request, calls `getUser()` (which transparently refreshes an expired
 * token), and writes the refreshed cookie onto the outgoing response.
 *
 * It also does the coarse "are you logged in at all" gate for the
 * authenticated app section — per-care-profile authorization is a separate,
 * stricter check done in each route/page via Row Level Security.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/reset-password", "/auth"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/_next")) return true;
  // API routes handle their own auth check and return a proper JSON 401 —
  // redirecting them to the HTML /login page here would break every fetch()
  // call in the app the moment a session expires mid-use (the client would
  // try to JSON-parse a login page and show a confusing "network error"
  // instead of the real "please log in again"). The session-refresh logic
  // above still runs for these requests either way.
  if (pathname.startsWith("/api/")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  // If Supabase isn't configured yet (fresh clone, no .env.local), don't
  // hard-crash every request — let pages render their own "not configured"
  // states instead of a 500 from the proxy.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
