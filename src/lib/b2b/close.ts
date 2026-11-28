import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Closing a B2B request (see /api/admin/b2b-requests/[id]/close). A closed
// request stays open to admins — edit or reopen — for 2 months after it was
// closed, then it is frozen for good.

export const B2B_CLOSED_EDIT_DAYS = 60;

export const isB2bAdmin = (role?: string | null) => role === "SUPERADMIN" || role === "ADMIN";

/** When the request was last closed (its latest → REJECTED activity). */
export async function b2bRequestClosedAt(leadId: string): Promise<Date | null> {
  const act = await prisma.leadActivity.findFirst({
    where: { leadId, type: "STATUS_CHANGE", toStatus: "REJECTED" },
    orderBy: { performedAt: "desc" },
    select: { performedAt: true },
  });
  return act?.performedAt ?? null;
}

/** Last day an admin may still edit/reopen a request closed at `closedAt`. */
export function b2bClosedEditableUntil(closedAt: Date | null): Date | null {
  return closedAt ? new Date(closedAt.getTime() + B2B_CLOSED_EDIT_DAYS * 86_400_000) : null;
}

/** Admin, and still inside the window. A request closed with no recorded
 *  activity counts as closed now. */
export function canAdminUpdateClosed(role: string | null | undefined, closedAt: Date | null): boolean {
  if (!isB2bAdmin(role)) return false;
  const until = b2bClosedEditableUntil(closedAt);
  return !until || until.getTime() > Date.now();
}

/**
 * Requests of this agent that are closed now (a reopened one no longer counts)
 * and were closed since the agent's latest activation — so a reactivated
 * partner starts again from zero.
 */
export async function b2bClosedCount(
  agentId: string,
  db: Prisma.TransactionClient = prisma,
): Promise<number> {
  const lastActivation = await db.auditLog.findFirst({
    where: {
      action: "B2B_AGENT_STATUS_CHANGE",
      targetUserId: agentId,
      metadata: { path: ["toStatus"], equals: "ACTIVE" },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return db.lead.count({
    where: {
      b2bAgentId: agentId,
      status: "REJECTED",
      activities: {
        some: {
          type: "STATUS_CHANGE",
          toStatus: "REJECTED",
          ...(lastActivation ? { performedAt: { gte: lastActivation.createdAt } } : {}),
        },
      },
    },
  });
}
