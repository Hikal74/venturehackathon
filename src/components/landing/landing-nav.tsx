import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
      <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-status-recovering" aria-hidden />
        AuraLink Care
      </div>
      <nav className="flex items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Try Demo</Link>
        </Button>
      </nav>
    </header>
  );
}
