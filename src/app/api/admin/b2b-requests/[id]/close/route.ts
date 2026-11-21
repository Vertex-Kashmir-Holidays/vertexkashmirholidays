import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { B2B_CLOSE_LIMIT } from "@/lib/b2b/requestStatus";
import { sendB2bRequestClosedEmail } from "@/lib/b2b/notify";
import { b2bClosedCount, b2bRequestClosedAt, canAdminUpdateClosed } from "@/lib/b2b/close";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  reason: z.string().trim().min(3, "Give the agent a reason.").max(1000),
});

/**
 * Close (reject) a B2B request: status REJECTED (shown as "Closed"), the reason
 * goes on the lead's activity, and the agent is emailed. On reaching
 * B2B_CLOSE_LIMIT closed requests (b2bClosedCount) an ACTIVE agent is suspended (they can no longer send requests; existing bookings stay).
 */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("b2bRequests", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid reason" },
      { status: 422 },
    );
  }
  const { reason } = parsed.data;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      days: true,
      adults: true,
      children: true,
      status: true,
      locked: true,
      b2bAgentId: true,
      b2bAgent: { select: { id: true, name: true, email: true, agencyName: true, agencyStatus: true } },
    },
  });
  if (!lead || !lead.b2bAgentId || !lead.b2bAgent) {
    return NextResponse.json({ error: "B2B request not found" }, { status: 404 });
  }
  if (lead.status === "CONVERTED" || lead.locked) {
    return NextResponse.json({ error: "This request is already converted." }, { status: 422 });
  }
  if (lead.status === "REJECTED") {
    return NextResponse.json({ error: "This request is already closed." }, { status: 422 });
  }

  const agent = lead.b2bAgent;
  const performedById = guard.user.id as string;
  const performedByName = (guard.user.name ?? guard.user.email) as string;

  const { closedCount, deactivated } = await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id }, data: { status: "REJECTED" } });
    await tx.leadActivity.create({
      data: {
        leadId: id,
        type: "STATUS_CHANGE",
        fromStatus: lead.status,
        toStatus: "REJECTED",
        note: reason,
        performedById,
        performedByName,
      },
    });
    const closedCount = await b2bClosedCount(agent.id, tx);
    const deactivated = closedCount >= B2B_CLOSE_LIMIT && agent.agencyStatus === "ACTIVE";
    if (deactivated) {
      await tx.user.update({ where: { id: agent.id }, data: { agencyStatus: "SUSPENDED" } });
      await tx.auditLog.create({
        data: {
          action: "B2B_AGENT_STATUS_CHANGE",
          targetUserId: agent.id,
          targetUserName: agent.name,
          targetUserEmail: agent.email,
          performedById,
          performedByName,
          metadata: {
            fromStatus: "ACTIVE",
            toStatus: "SUSPENDED",
            reason: `${closedCount} closed requests`,
          },
        },
      });
    }
    return { closedCount, deactivated };
  });

  // Best-effort — the close stands even if the email doesn't go out.
  const { delivered } = await sendB2bRequestClosedEmail(
    agent,
    { guestName: lead.name, days: lead.days, pax: lead.adults + (lead.children ?? 0) },
    reason,
    closedCount,
    B2B_CLOSE_LIMIT,
    deactivated,
  );

  return NextResponse.json({ closedCount, deactivated, emailDelivered: delivered });
}

/**
 * Reopen a closed request — admins only, within 2 months of the close date.
 * Back to In Progress if it has an itinerary, else Pending. Doesn't reactivate
 * a suspended agent (do that from B2B Agents); no email is sent.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("b2bRequests", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, status: true, b2bAgentId: true, itinerary: { select: { id: true } } },
  });
  if (!lead || !lead.b2bAgentId) {
    return NextResponse.json({ error: "B2B request not found" }, { status: 404 });
  }
  if (lead.status !== "REJECTED") {
    return NextResponse.json({ error: "This request isn't closed." }, { status: 422 });
  }
  if (!canAdminUpdateClosed(guard.user.role as string, await b2bRequestClosedAt(id))) {
    return NextResponse.json(
      { error: "Only an admin can reopen a closed request, within 2 months of closing it." },
      { status: 403 },
    );
  }

  const toStatus = lead.itinerary ? "IN_PROGRESS" : "NEW";
  await prisma.$transaction([
    prisma.lead.update({ where: { id }, data: { status: toStatus } }),
    prisma.leadActivity.create({
      data: {
        leadId: id,
        type: "STATUS_CHANGE",
        fromStatus: "REJECTED",
        toStatus,
        note: "Request reopened",
        performedById: guard.user.id as string,
        performedByName: (guard.user.name ?? guard.user.email) as string,
      },
    }),
  ]);
  return NextResponse.json({ status: toStatus });
}
