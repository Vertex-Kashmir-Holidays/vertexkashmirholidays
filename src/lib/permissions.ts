// Server-only permission helpers. Reads the DB-driven RolePermission matrix.
// Do NOT import this from middleware / auth.config (edge) — use src/lib/rbac.ts there.
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  type Action,
  type ModuleKey,
  type PermissionMap,
  type Role,
  emptyPermissionMap,
  fullPermissionMap,
  isStaff,
} from "@/lib/rbac";

// The RolePermission table rarely changes (only when a SUPERADMIN edits role
// permissions) but is read on nearly every authenticated admin request —
// unstable_cache shares one DB read across requests instead of hitting the
// DB fresh every time. Keyed per-role since each role has a different map.
// revalidateTag("role-permissions", ...) in the role-permissions save route
// (+ the existing flushPublicCache admin action) invalidates it immediately
// on edit; the 5-minute TTL is a safety net either way.
const fetchRolePermissionRows = unstable_cache(
  async (role: Role) => prisma.rolePermission.findMany({ where: { role } }),
  ["role-permissions"],
  { revalidate: 300, tags: ["role-permissions"] },
);

/**
 * Resolve the effective permission map for a role.
 * SUPERADMIN always gets full access (can never lock itself out).
 * Everyone else is resolved from the RolePermission table.
 * Wrapped in React cache() so repeated calls within one request hit the DB once.
 */
export const getRolePermissions = cache(
  async (role: Role): Promise<PermissionMap> => {
    if (role === "SUPERADMIN") return fullPermissionMap();

    const rows = await fetchRolePermissionRows(role);
    const map = emptyPermissionMap();

    for (const row of rows) {
      const key = row.module as ModuleKey;
      if (key in map) {
        map[key] = {
          view: row.canView,
          create: row.canCreate,
          edit: row.canEdit,
          delete: row.canDelete,
        };
      }
    }

    return map;
  },
);

/** True if `role` may perform `action` on `module`. */
export async function can(
  role: Role,
  module: ModuleKey,
  action: Action,
): Promise<boolean> {
  if (role === "SUPERADMIN") return true;
  if (!isStaff(role)) return false;
  const perms = await getRolePermissions(role);
  return perms[module]?.[action] ?? false;
}

export type AuthorizedSession = Session;

/**
 * Guard for endpoints that any staff member may use but which aren't tied to a
 * single module (e.g. file uploads). Returns the session or a 401/403.
 */
export async function requireStaff(): Promise<AuthorizedSession | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(session.user.role as Role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}

/**
 * Guard for API routes / server actions. Returns the session when the current
 * user may perform `action` on `module`, otherwise a JSON 401/403 NextResponse.
 *
 *   const guard = await requirePermission("packages", "create");
 *   if (guard instanceof NextResponse) return guard;
 *   const { user } = guard; // authorized
 */
export async function requirePermission(
  module: ModuleKey,
  action: Action,
): Promise<AuthorizedSession | NextResponse> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!session?.user || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await can(role, module, action))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return session;
}
