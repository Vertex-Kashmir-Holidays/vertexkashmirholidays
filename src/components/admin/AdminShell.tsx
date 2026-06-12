"use client";

import { useState } from "react";
import Link from "next/link";
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
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  Headphones,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/packages", label: "Packages", Icon: Package },
  { href: "/admin/destinations", label: "Destinations", Icon: MapPin },
  { href: "/admin/bookings", label: "Bookings", Icon: CalendarDays },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/galleries", label: "Galleries", Icon: Images },
  { href: "/admin/blogs", label: "Blogs", Icon: FileText },
  { href: "/admin/reviews", label: "Reviews", Icon: Star },
  { href: "/admin/seo", label: "SEO & Pages", Icon: Globe },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/packages": "Packages",
  "/admin/destinations": "Destinations",
  "/admin/bookings": "Bookings",
  "/admin/users": "Users",
  "/admin/galleries": "Galleries",
  "/admin/blogs": "Blogs",
  "/admin/reviews": "Reviews",
  "/admin/seo": "SEO & Pages",
  "/admin/settings": "Settings",
};

interface AdminShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

function SidebarContent({
  pathname,
  userName,
  userEmail,
  onClose,
}: {
  pathname: string;
  userName: string;
  userEmail: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-[#0d1b3e] text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
        <Logo variant="light" width={120} height={36} />
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-green text-white shadow-sm shadow-brand-green/30"
                  : "text-white/55 hover:text-white hover:bg-white/7",
              )}
            >
              <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-white" : "text-white/50")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Need Help card */}
      <div className="px-4 pb-4">
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
      </div>

      {/* User info + sign out */}
      <div className="border-t border-white/8 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-xs font-bold shrink-0">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">{userName}</p>
          <p className="text-white/40 text-[10px] truncate">{userEmail}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-white/40 hover:text-red-400 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children, userName, userEmail }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <SidebarContent pathname={pathname} userName={userName} userEmail={userEmail} />
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
              userName={userName}
              userEmail={userEmail}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-brand-navy text-base">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-gray-400 hover:text-brand-green transition-colors hidden sm:inline"
            >
              View Site
            </Link>
            <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-orange rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
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
