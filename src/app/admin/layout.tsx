import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/rbac";
import { getRolePermissions } from "@/lib/permissions";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/login");
  }

  const permissions = await getRolePermissions(session.user.role);

  return (
    <AdminShell
      userName={session.user.name ?? "Admin"}
      userEmail={session.user.email ?? ""}
      role={session.user.role}
      permissions={permissions}
    >
      {children}
    </AdminShell>
  );
}
