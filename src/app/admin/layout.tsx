import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff, MODULES } from "@/lib/rbac";
import { getRolePermissions } from "@/lib/permissions";
import { resolveModuleForPath } from "@/lib/admin/moduleGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { TooltipProvider } from "@/components/ui/atoms/tooltip";

// Personal-utility routes every authenticated staff member must always be
// able to reach, regardless of module permissions (they aren't "modules").
const UNGATED_PATHS = ["/admin/mfa", "/admin/profile"];

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

  // Single authoritative "can this staff member open this route" check — the
  // module is resolved from the request path instead of every module folder
  // declaring its own layout.tsx with a copy-pasted (and easily stale) module
  // key. SUPERADMIN's map is always full (see getRolePermissions), so this
  // never blocks a super admin.
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const isUngated = UNGATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const moduleKey = isUngated ? null : resolveModuleForPath(pathname);
  const allowed = isUngated || Boolean(moduleKey && permissions[moduleKey]?.view);
  const moduleLabel = moduleKey ? (MODULES.find((m) => m.key === moduleKey)?.label ?? moduleKey) : "this page";

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
            {allowed ? children : <AccessDenied moduleLabel={moduleLabel} />}
          </AdminShell>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
