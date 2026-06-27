"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  MapPin,
  CalendarDays,
  Users,
  Images,
  FileText,
  Star,
  Globe,
  Settings,
  ShieldCheck,
  Inbox,
  Home,
  Info,
  Phone,
  ScrollText,
  Megaphone,
  LogOut,
  Menu,
  X,
  Map,
  Ticket,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ChatInbox } from "@/components/admin/ChatInbox";
import { PresenceStatusPicker } from "@/components/admin/PresenceStatusPicker";
import { PresenceHeartbeat } from "@/components/admin/connect/PresenceHeartbeat";
import { cn } from "@/lib/utils";
import { MODULES, type ModuleKey, type PermissionMap, type Role } from "@/lib/rbac";

const MODULE_ICONS: Record<ModuleKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  packages: Package,
  destinations: MapPin,
  activities: Ticket,
  bookings: CalendarDays,
  leads: Inbox,
  itinerary: Map,
  users: Users,
  connect: MessageSquare,
  galleries: Images,
  blogs: FileText,
  home: Home,
  about: Info,
  contact: Phone,
  legal: ScrollText,
  campaigns: Megaphone,
  reviews: Star,
  seo: Globe,
  settings: Settings,
  roles: ShieldCheck,
};

const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  MODULES.map((m) => [m.href, m.label]),
);

interface AdminShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userImage: string | null;
  role: Role;
  permissions: PermissionMap;
}

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

// Small circular avatar showing the user's picture, or their initial as a
// fallback. Used in both the sidebar and the topbar.
function Avatar({ src, name, className }: { src: string | null; name: string; className?: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={32}
        height={32}
        unoptimized
        className={cn("rounded-full object-cover shrink-0", className)}
      />
    );
  }
  return (
    <div className={cn("rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0", className)}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SidebarContent({
  pathname,
  nav,
  userName,
  userEmail,
  userImage,
  onClose,
}: {
  pathname: string;
  nav: NavItem[];
  userName: string;
  userEmail: string;
  userImage: string | null;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-card text-foreground border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border">
        <Logo variant="auto" />
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Need Help card */}
      {/* <div className="px-4 pb-4">
        <div className="bg-brand-green/15 border border-brand-green/30 rounded-2xl p-4">
          <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center mb-2">
            <Headphones className="w-4 h-4 text-brand-green" />
          </div>
          <p className="font-semibold text-white text-sm mb-0.5">Ready to Help?</p>
          <p className="text-white/45 text-xs mb-3 leading-relaxed">
            Get support from our technical team anytime.
          </p>
          <a
            href="mailto:support@vertexkashmirholidays.com"
            className="flex items-center justify-center gap-1 bg-brand-green hover:bg-brand-green/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            Get Support <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div> */}

      {/* User info (links to profile) + sign out */}
      <div className="border-t border-border px-4 py-3 flex items-center gap-3">
        <Link
          href="/admin/profile"
          onClick={onClose}
          className="flex flex-1 min-w-0 items-center gap-3 rounded-lg -mx-1 px-1 py-1 transition-colors hover:bg-muted"
          title="My profile"
        >
          <Avatar src={userImage} name={userName} className="w-8 h-8" />
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-xs font-semibold truncate">{userName}</p>
            <p className="text-muted-foreground text-[10px] truncate">{userEmail}</p>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children, userName, userEmail, userImage, permissions }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = pathname === "/admin/profile" ? "My Profile" : PAGE_TITLES[pathname] ?? "Admin";

  // Only show modules the current role may view.
  const nav: NavItem[] = MODULES.filter((m) => permissions[m.key]?.view).map((m) => ({
    href: m.href,
    label: m.label,
    Icon: MODULE_ICONS[m.key],
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <SidebarContent pathname={pathname} nav={nav} userName={userName} userEmail={userEmail} userImage={userImage} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-56 flex flex-col">
            <SidebarContent
              pathname={pathname}
              nav={nav}
              userName={userName}
              userEmail={userEmail}
              userImage={userImage}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-5 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-foreground text-base">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-muted-foreground hover:text-primary transition-colors hidden sm:inline"
            >
              View Site
            </Link>
            <ThemeToggle />
            <ChatInbox />
            <NotificationBell />
            <PresenceStatusPicker userImage={userImage} userName={userName} />
            <PresenceHeartbeat />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
