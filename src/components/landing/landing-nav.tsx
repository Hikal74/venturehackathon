import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/brand-mark";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-[#f8f9fa]/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <BrandMark className="h-3.5 w-3.5" />
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
      </div>
    </header>
  );
}
