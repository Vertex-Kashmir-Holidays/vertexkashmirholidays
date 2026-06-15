"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, CalendarDays, CreditCard, UserCircle, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Overview", Icon: LayoutDashboard },
  { href: "/account/bookings", label: "My Bookings", Icon: CalendarDays },
  { href: "/account/payments", label: "Payments", Icon: CreditCard },
  { href: "/account/profile", label: "Profile", Icon: UserCircle },
];

interface AccountShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

export function AccountShell({ children, userName, userEmail }: AccountShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-brand-page">
      {/* Top bar */}
      <header className="border-b border-brand-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
          <Logo href="/" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-brand-ink">{userName}</p>
              <p className="text-[10px] text-brand-mute">{userEmail}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 rounded-lg border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-ink transition hover:bg-brand-page"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] lg:px-6">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-brand-line bg-white p-2 lg:flex-col lg:overflow-visible">
            {NAV.map(({ href, label, Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-brand-green text-white shadow-sm"
                      : "text-brand-ink/70 hover:bg-brand-page",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
