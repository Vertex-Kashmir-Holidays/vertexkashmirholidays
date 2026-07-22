import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/rbac";
import { getRolePermissions } from "@/lib/permissions";
import { AdminShell } from "@/components/admin/AdminShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { TooltipProvider } from "@/components/ui/atoms/tooltip";

// GTM must never load here — this route group is intentionally the only one
// of the four (public / admin / account / login) that doesn't render
// <SiteAnalytics>. This layout already calls auth() (fully dynamic on every
// request regardless), so reading the CSP nonce via headers() here costs
// nothing extra.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/login");
  }

  const [permissions, profile, requestHeaders] = await Promise.all([
    getRolePermissions(session.user.role),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, image: true } }),
    headers(),
  ]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  // SessionProvider lets client components (e.g. the MFA enroll/challenge
  // forms under /admin/mfa) call useSession().update() to refresh the JWT
  // after a server-side change — same reason account/layout.tsx has it.
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        nonce={nonce}
      >
        <TooltipProvider delayDuration={200}>
          <OfflineBanner />
          <AdminShell
            userId={session.user.id}
            userName={profile?.name ?? session.user.name ?? "Admin"}
            userEmail={session.user.email ?? ""}
            userImage={profile?.image ?? null}
            role={session.user.role}
            permissions={permissions}
          >
            {children}
          </AdminShell>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
