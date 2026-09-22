export interface NavLink {
  href: string;
  label: string;
}

export const PRIMARY_NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/timeline", label: "Timeline" },
  { href: "/patterns", label: "Patterns" },
  { href: "/aura-ai", label: "Aura AI" },
  { href: "/reports", label: "Reports" },
  { href: "/care-profile", label: "Care Profile" },
  { href: "/devices", label: "Devices" },
];
