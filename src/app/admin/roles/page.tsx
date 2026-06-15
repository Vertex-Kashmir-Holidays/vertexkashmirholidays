import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { MODULES, STAFF_ROLES, type ModuleKey } from "@/lib/rbac";
import { RolesClient, type RoleMatrix } from "@/components/admin/roles/RolesClient";

export const metadata: Metadata = { title: "Roles & Permissions — Admin" };
export const dynamic = "force-dynamic";

const EDITABLE_ROLES = STAFF_ROLES.filter((r) => r !== "SUPERADMIN");

export default async function AdminRolesPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (!role || !(await can(role, "roles", "view"))) {
    redirect("/admin/dashboard");
  }

  const canEdit = await can(role, "roles", "edit");
  const rows = await prisma.rolePermission.findMany({
    where: { role: { in: EDITABLE_ROLES } },
  });

  // Build the full matrix, defaulting any missing role/module to no-access.
  const matrix: RoleMatrix = {};
  for (const r of EDITABLE_ROLES) {
    matrix[r] = {};
    for (const m of MODULES) {
      matrix[r][m.key] = { view: false, create: false, edit: false, delete: false };
    }
  }
  for (const row of rows) {
    const key = row.module as ModuleKey;
    if (matrix[row.role]?.[key]) {
      matrix[row.role][key] = {
        view: row.canView,
        create: row.canCreate,
        edit: row.canEdit,
        delete: row.canDelete,
      };
    }
  }

  return <RolesClient roles={EDITABLE_ROLES} initialMatrix={matrix} canEdit={canEdit} />;
}
