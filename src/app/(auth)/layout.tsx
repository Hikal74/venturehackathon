import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-status-recovering" aria-hidden />
        AuraLink Care
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        AuraLink Care is an assistive monitoring tool, not a medical device. It does not diagnose autism,
        anxiety, or any medical condition.
      </p>
    </div>
  );
}
