import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <LoginForm next={params.next} />
      {params.error === "auth-callback-failed" && (
        <p className="text-center text-sm text-status-critical">
          That link expired or was already used. Try signing in, or request a new link.
        </p>
      )}
    </div>
  );
}
