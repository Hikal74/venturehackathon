"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronsUpDown, Plus } from "lucide-react";
import { switchActiveCareProfileAction } from "@/app/care-profile/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CareProfileRow } from "@/services/care-profiles";

export function CareProfileSwitcher({
  profiles,
  activeId,
}: {
  profiles: CareProfileRow[];
  activeId: string | null;
}) {
  const pathname = usePathname();
  const active = profiles.find((p) => p.id === activeId) ?? profiles[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
        >
          <span className="truncate">{active ? active.display_name : "No care profile"}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {profiles.map((profile) => (
          <form key={profile.id} action={switchActiveCareProfileAction}>
            <input type="hidden" name="careProfileId" value={profile.id} />
            <input type="hidden" name="next" value={pathname} />
            <DropdownMenuItem asChild>
              <button type="submit" className="flex w-full items-center justify-between">
                <span className="truncate">{profile.display_name}</span>
                {profile.id === active?.id && <span className="text-xs text-muted-foreground">Active</span>}
              </button>
            </DropdownMenuItem>
          </form>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add care profile
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
