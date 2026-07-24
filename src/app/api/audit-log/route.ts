import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = [
  "ROLE_CHANGE",
  "PERMISSION_EDIT",
  "USER_SOFT_DELETE",
  "USER_PERMANENT_DELETE",
  "USER_RESTORE",
] as const;

// Read-only — audit log entries are only ever written internally, alongside
// the mutation they record (see users/[id]/route.ts, .../restore/route.ts,
// admin/role-permissions/route.ts). No POST/PATCH/DELETE on this resource.
export async function GET(req: NextRequest) {
  const guard = await requirePermission("auditLog", "view");
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action")?.trim();
  const targetUserId = searchParams.get("targetUserId")?.trim();
  const performedById = searchParams.get("performedById")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
  const requestedPageSize = parseInt(searchParams.get("pageSize") ?? "25");
  const take = PAGE_SIZE_OPTIONS.includes(requestedPageSize) ? requestedPageSize : 25;
  const skip = (page - 1) * take;

  const where: Prisma.AuditLogWhereInput = {};
  if (action && action !== "ALL" && (VALID_ACTIONS as readonly string[]).includes(action)) {
    where.action = action as Prisma.AuditLogWhereInput["action"];
  }
  if (targetUserId) where.targetUserId = targetUserId;
  if (performedById) where.performedById = performedById;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / take) });
}
