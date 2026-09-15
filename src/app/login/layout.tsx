import type { Metadata } from "next";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

// Belt-and-suspenders on top of robots.ts's `disallow: "/login"` — see
// src/app/admin/layout.tsx for the identical rationale.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// login/page.tsx already calls auth() directly and sets `dynamic = "force-dynamic"`,
// so this route is fully dynamic regardless — reading the CSP nonce via
// headers() here costs nothing extra. GTM/analytics no longer load on /login
// (a staff/customer sign-in page has no business being tracked) —
// <SiteAnalytics> and <CookieConsentManager> are intentionally not rendered
// here, matching /admin and /account.
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      nonce={nonce}
    >
      <OfflineBanner />
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
