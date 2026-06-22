import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/rbac";
import { getRolePermissions } from "@/lib/permissions";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/login");
  }

  const [permissions, profile] = await Promise.all([
    getRolePermissions(session.user.role),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, image: true } }),
  ]);

  return (
    <AdminShell
      userName={profile?.name ?? session.user.name ?? "Admin"}
      userEmail={session.user.email ?? ""}
      userImage={profile?.image ?? null}
      role={session.user.role}
      permissions={permissions}
    >
      {children}
    </AdminShell>
  );
}
