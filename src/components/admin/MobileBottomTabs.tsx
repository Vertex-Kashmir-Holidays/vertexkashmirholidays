"use client";

import Link from "next/link";
import { LayoutDashboard, Package, Inbox, CalendarDays, MessageSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleKey, PermissionMap } from "@/lib/rbac";

interface TabDef {
  key: ModuleKey;
  href: string;
  label: string;
  Icon: LucideIcon;
}

// Fixed, curated set (not the full sidebar) — the handful of sections staff
// need one-tap access to on a phone. Same MODULE_ICONS choices as the sidebar
// for Dashboard/Packages/Leads/Bookings; Connect uses "Chats" here since that's
// what it's used for day-to-day, even though the module itself is "Vertex Connect".
const TABS: TabDef[] = [
  { key: "dashboard", href: "/admin/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "packages", href: "/admin/packages", label: "Packages", Icon: Package },
  { key: "leads", href: "/admin/leads", label: "Leads", Icon: Inbox },
  { key: "bookings", href: "/admin/bookings", label: "Bookings", Icon: CalendarDays },
  { key: "connect", href: "/admin/connect", label: "Chats", Icon: MessageSquare },
];

interface Props {
  pathname: string;
  permissions: PermissionMap;
}

/** Bottom tab bar for admin on small screens — hidden at lg (desktop keeps the sidebar only). */
export function MobileBottomTabs({ pathname, permissions }: Props) {
  const visibleTabs = TABS.filter((t) => permissions[t.key]?.view);
  if (visibleTabs.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card border-t border-border flex items-stretch shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {visibleTabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[12px] font-semibold transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
