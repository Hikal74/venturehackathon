import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { UpdatePasswordForm } from "@/app/(auth)/update-password/update-password-form";
import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const { user, profile, all } = await getSessionContext();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and application settings.</p>
      </div>

      <div className="clay flex flex-col gap-3 p-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Account</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="capitalize">{profile?.role ?? "caregiver"}</dd>
          <dt className="text-muted-foreground">Care profiles</dt>
          <dd>{all.length}</dd>
        </dl>
        <form action={signOutAction} className="pt-2">
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </div>

      <div className="max-w-sm">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Change password</h2>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
