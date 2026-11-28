import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountShell } from "@/components/account/AccountShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { agentVisibleDocsWhere } from "@/lib/docs/upload";

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
    // Back to the page they asked for after signing in (e.g. a push notification's
    // link). The login page only honours same-origin relative paths.
    const path = (await headers()).get("x-pathname");
    redirect(path ? `/login?callbackUrl=${encodeURIComponent(path)}` : "/login");
  }

  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  const isB2bAgent = session.user.agencyStatus !== null;
  const agencyDocs = isB2bAgent
    ? await prisma.adminDocument.findMany({
        where: agentVisibleDocsWhere(session.user.id),
        // Shared with them personally first, then the all-partner library.
        orderBy: [{ agentId: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          mimeType: true,
          agentId: true,
          createdAt: true,
        },
      })
    : [];

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
          isB2bAgent={isB2bAgent}
          agencyDocs={agencyDocs}
        >
          {children}
        </AccountShell>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
