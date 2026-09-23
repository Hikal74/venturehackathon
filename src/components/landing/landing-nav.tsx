"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

/**
 * Sticky landing nav with two jobs, both scroll-driven off the same
 * sentinel/IntersectionObserver (see the compacting behavior below,
 * design brief §5):
 *
 * 1. Compacts and firms up its elevation once scrolled past the very
 *    top — "lightweight and premium," never a fixed slab eating screen
 *    space.
 * 2. Starts transparent with light text over the hero's dark band (see
 *    .hero-band in globals.css), then crossfades to the normal solid
 *    light nav once the page has scrolled into the light content below
 *    it — the standard "nav over a dark hero" pattern, so the nav never
 *    fights the section it's sitting on.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      <header
        data-nav
        data-scrolled={scrolled}
        className={cn(
          "fixed inset-x-0 top-0 z-10 border-b backdrop-blur-md transition-colors",
          scrolled ? "border-black/5 bg-[#f8f9fa]/80" : "border-white/10 bg-transparent"
        )}
      >
        <div
          className={`mx-auto flex w-full max-w-6xl items-center justify-between px-4 md:px-6 ${
            scrolled ? "py-2.5" : "py-4"
          }`}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 text-base font-semibold tracking-tight transition-colors",
              scrolled ? "text-foreground" : "text-white"
            )}
          >
            <BrandMark className="h-3.5 w-3.5" />
            AuraLink Care
          </Link>
          <nav className="flex items-center gap-3">
            <Button
              variant="ghost"
              className={cn("transition-colors", !scrolled && "text-white hover:bg-white/10 hover:text-white")}
              asChild
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Try Demo</Link>
            </Button>
          </nav>
        </div>
      </header>
    </>
  );
}
