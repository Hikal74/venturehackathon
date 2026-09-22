"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  Sparkles,
  MessageCircle,
  FileText,
  UserCircle,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV_LINKS } from "./nav-links";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/timeline": History,
  "/patterns": Sparkles,
  "/aura-ai": MessageCircle,
  "/reports": FileText,
  "/care-profile": UserCircle,
  "/devices": Radio,
};

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {PRIMARY_NAV_LINKS.map((link) => {
        const Icon = ICONS[link.href] ?? LayoutDashboard;
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
