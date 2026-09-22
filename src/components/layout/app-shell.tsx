"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";
import { CareProfileSwitcher } from "./care-profile-switcher";
import { UserMenu } from "./user-menu";
import type { CareProfileRow } from "@/services/care-profiles";

export function AppShell({
  displayName,
  email,
  careProfiles,
  activeCareProfileId,
  children,
}: {
  displayName: string;
  email: string | null;
  careProfiles: CareProfileRow[];
  activeCareProfileId: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-border bg-background px-4 py-6 md:flex print:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 px-1 text-base font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-status-recovering" aria-hidden />
          AuraLink Care
        </Link>
        <CareProfileSwitcher profiles={careProfiles} activeId={activeCareProfileId} />
        <SidebarNav />
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <UserMenu displayName={displayName} email={email} />
          <span className="truncate text-xs text-muted-foreground">{displayName}</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden print:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 px-4 py-6">
              <SheetTitle className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-status-recovering" aria-hidden />
                AuraLink Care
              </SheetTitle>
              <div className="flex flex-col gap-6">
                <CareProfileSwitcher profiles={careProfiles} activeId={activeCareProfileId} />
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold tracking-tight">AuraLink Care</span>
          <UserMenu displayName={displayName} email={email} />
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
