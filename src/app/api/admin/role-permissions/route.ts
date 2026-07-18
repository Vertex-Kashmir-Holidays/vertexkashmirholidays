import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { MODULE_KEYS, STAFF_ROLES } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// Roles that can actually be edited here. SUPERADMIN is full-access by code
// (no rows, can't be locked out); CUSTOMER is not a staff role.
const EDITABLE_ROLES = STAFF_ROLES.filter((r) => r !== "SUPERADMIN");

export async function GET() {
  const guard = await requirePermission("roles", "view");
  if (guard instanceof NextResponse) return guard;

  const rows = await prisma.rolePermission.findMany({
    where: { role: { in: EDITABLE_ROLES } },
  });

  // Shape: { ROLE: { module: { view, create, edit, delete } } }, defaulting to false.
  const matrix: Record<string, Record<string, Record<string, boolean>>> = {};
  for (const role of EDITABLE_ROLES) {
    matrix[role] = {};
    for (const moduleKey of MODULE_KEYS) {
      matrix[role][moduleKey] = { view: false, create: false, edit: false, delete: false };
    }
  }
  for (const row of rows) {
    if (matrix[row.role] && matrix[row.role][row.module]) {
      matrix[row.role][row.module] = {
        view: row.canView,
        create: row.canCreate,
        edit: row.canEdit,
        delete: row.canDelete,
      };
    }
  }

  return NextResponse.json({ roles: EDITABLE_ROLES, modules: MODULE_KEYS, matrix });
}

const updateSchema = z.object({
  role: z.enum(EDITABLE_ROLES as [string, ...string[]]),
  module: z.enum(MODULE_KEYS as [string, ...string[]]),
  canView: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

export async function PUT(req: NextRequest) {
  const guard = await requirePermission("roles", "edit");
  if (guard instanceof NextResponse) return guard;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { role, module, canView, canCreate, canEdit, canDelete } = parsed.data;

  // Revoking view implies revoking every action on that module.
  const effectiveView = canView || canCreate || canEdit || canDelete;
  const data = {
    canView: effectiveView,
    canCreate,
    canEdit,
    canDelete,
  };

  const saved = await prisma.rolePermission.upsert({
    // role/module come from validated enums; cast for the typed Prisma client.
    where: { role_module: { role: role as never, module } },
    update: data,
    create: { role: role as never, module, ...data },
  });

  revalidateTag("role-permissions", "max");
  return NextResponse.json({ permission: saved });
}
