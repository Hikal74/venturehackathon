import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Layout for the authenticated app section. `src/proxy.ts` already blocks
 * anonymous requests from reaching here, so `user` below is expected to
 * exist — but we still check, since a session can expire between the proxy
 * check and this render on a slow connection.
 *
 * If the caregiver has no care profile yet, everything under this layout
 * requires one, so we send them to onboarding rather than show an empty
 * dashboard shell.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, active, all } = await getSessionContext();

  if (!user) {
    redirect("/login");
  }

  if (!active) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      displayName={profile?.display_name ?? user.email?.split("@")[0] ?? "You"}
      email={user.email ?? null}
      careProfiles={all}
      activeCareProfileId={active.id}
    >
      {children}
    </AppShell>
  );
}
