import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, can } from "@/lib/permissions";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
});

/** Approve/reject (manager only) or cancel (owner, while still PENDING).
 * Ownership + authorization enforced server-side — never trust the client. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leave", "view");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id } = await params;

  const existing = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { select: { id: true, name: true, email: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Leave request not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 422 });
  const { status } = parsed.data;

  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Only a pending request can be updated." }, { status: 422 });
  }

  const isManager = await can(role, "leave", "edit");

  if (status === "CANCELLED") {
    if (existing.employeeId !== userId && !isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!isManager) {
    return NextResponse.json({ error: "Only an authorized manager can do that." }, { status: 403 });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      ...(status !== "CANCELLED" ? { reviewedById: userId, reviewedAt: new Date() } : {}),
    },
  });

  if (status === "APPROVED" || status === "REJECTED") {
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    await prisma.auditLog.create({
      data: {
        action: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
        targetUserId: existing.employee.id,
        targetUserName: existing.employee.name,
        targetUserEmail: existing.employee.email,
        performedById: userId,
        performedByName: me?.name ?? me?.email ?? "Unknown",
        metadata: { leaveRequestId: id, type: existing.type, days: existing.days },
      },
    });
  }

  return NextResponse.json(updated);
}
