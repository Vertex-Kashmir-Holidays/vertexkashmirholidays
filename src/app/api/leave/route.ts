import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, can } from "@/lib/permissions";
import { computeLeaveBalance } from "@/lib/leave/entitlement";
import { currentIstMonth, isValidSalaryMonth } from "@/lib/salary/month";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/** Self-service by default (own history + own current-month balance).
 * `?scope=pending` additionally returns the org-wide approval queue, but only
 * for a `leave:edit` holder — never trust a client-sent scope alone. */
export async function GET(req: NextRequest) {
  const guard = await requirePermission("leave", "view");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const requestedMonth = searchParams.get("month");
  const month =
    requestedMonth && isValidSalaryMonth(requestedMonth) ? requestedMonth : currentIstMonth();
  const isManager = await can(role, "leave", "edit");

  const mine = await prisma.leaveRequest.findMany({
    where: { employeeId: userId },
    orderBy: { startDate: "desc" },
    take: 50,
  });
  const balance = await computeLeaveBalance(userId, month);

  if (scope === "pending" && isManager) {
    const pending = await prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { employee: { select: { id: true, name: true, email: true, designation: true } } },
    });
    return NextResponse.json({ isManager, mine, balance, month, pending });
  }

  return NextResponse.json({ isManager, mine, balance, month, pending: [] });
}

const applySchema = z.object({
  type: z.enum(["EARNED", "SICK", "UNPAID"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.coerce.number().positive().max(60),
  reason: z.string().trim().max(300).optional(),
});

/** Apply for leave — self-service, always allowed regardless of any granted
 * permission (view is seeded true for every staff role by default). */
export async function POST(req: NextRequest) {
  const guard = await requirePermission("leave", "view");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id as string;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const start = new Date(d.startDate);
  const end = new Date(d.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return NextResponse.json({ error: "Enter a valid date range." }, { status: 422 });
  }

  const created = await prisma.leaveRequest.create({
    data: {
      employeeId: userId,
      type: d.type,
      startDate: start,
      endDate: end,
      days: d.days,
      reason: d.reason ?? null,
    },
  });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  await prisma.auditLog.create({
    data: {
      action: "LEAVE_APPLIED",
      targetUserId: userId,
      targetUserName: me?.name ?? null,
      targetUserEmail: me?.email ?? null,
      performedById: userId,
      performedByName: me?.name ?? me?.email ?? "Unknown",
      metadata: { leaveRequestId: created.id, type: d.type, days: d.days },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
