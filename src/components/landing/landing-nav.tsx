"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/brand-mark";

/**
 * Sticky landing nav that compacts and firms up its elevation once the
 * page has scrolled past the very top — "lightweight and premium," never
 * a fixed slab eating screen space (design brief §5). A 1px sentinel at
 * the top of the page plus IntersectionObserver drives this instead of a
 * scroll listener, matching the same pattern ScrollReveal already uses
 * elsewhere, and it's cheaper: no per-scroll-event work, just one
 * observer callback when the sentinel crosses the viewport edge.
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
        className="sticky top-0 z-10 border-b border-black/5 bg-[#f8f9fa]/80 backdrop-blur-md"
      >
        <div
          className={`mx-auto flex w-full max-w-6xl items-center justify-between px-4 md:px-6 ${
            scrolled ? "py-2.5" : "py-4"
          }`}
        >
          <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <BrandMark className="h-3.5 w-3.5" />
            AuraLink Care
          </Link>
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
    </>
  );
}
