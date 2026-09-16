import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

// Belt-and-suspenders on top of robots.ts's `disallow: "/account/"` — see
// src/app/admin/layout.tsx for the identical rationale.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// This layout already calls auth() (fully dynamic on every request
// regardless), so reading the CSP nonce via headers() here costs nothing
// extra. GTM/analytics no longer load on /account (a signed-in traveller's
// own bookings/payments have no business being tracked, and staff already
// have their own visibility into who's logged in via the admin Users list) —
// <SiteAnalytics> and <CookieConsentManager> are intentionally not rendered
// here, matching /admin.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  // SessionProvider lets client components (e.g. the forced password-change form)
  // call useSession().update() to refresh the JWT after a server-side change.
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        nonce={nonce}
      >
        <OfflineBanner />
        <AccountShell
          userName={session.user.name ?? "Traveller"}
          userEmail={session.user.email ?? ""}
          isB2bAgent={session.user.agencyStatus !== null}
        >
          {children}
        </AccountShell>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
