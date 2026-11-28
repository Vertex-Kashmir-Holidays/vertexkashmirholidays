import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Who can see / work on a proposal: admins see every proposal; anyone else
// sees the ones they created (owner) or were handed (assignee) — e.g. a sales
// person making a proposal on a colleague's behalf assigns it to them.

export function isProposalAdmin(role?: string | null): boolean {
  return role === "SUPERADMIN" || role === "ADMIN";
}

/** Prisma filter for the proposals this user may see. */
export function proposalWhereForUser(
  role: string | null | undefined,
  userId: string,
): Prisma.ProposalItineraryWhereInput {
  return isProposalAdmin(role) ? {} : { OR: [{ ownerId: userId }, { assignedToId: userId }] };
}

/** Owner, assignee or admin. */
export function canAccessProposal(
  role: string | null | undefined,
  userId: string,
  record: { ownerId: string; assignedToId: string | null },
): boolean {
  return isProposalAdmin(role) || record.ownerId === userId || record.assignedToId === userId;
}

/** Staff a proposal can be assigned to — same pool as lead assignment. */
export const ASSIGNABLE_ROLES = ["SUPERADMIN", "ADMIN", "SALES"] as const;

export function listProposalAssignees() {
  return prisma.user.findMany({
    where: { role: { in: [...ASSIGNABLE_ROLES] }, deletedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
