import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ProposalSummary, ProposalStatus } from "@/types/proposal";

const STATUSES: ProposalStatus[] = ["DRAFT", "SENT"];

interface ListOptions {
  /** Set for non-admins — they only ever see their own proposals. */
  ownerId?: string;
  search?: string;
  /** "ALL" (or anything unrecognised) means no status filter. */
  status?: string;
  page: number;
  pageSize: number;
}

export async function listProposalSummaries({
  ownerId,
  search,
  status,
  page,
  pageSize,
}: ListOptions): Promise<{ items: ProposalSummary[]; total: number }> {
  const where: Prisma.ProposalItineraryWhereInput = {};
  if (ownerId) where.ownerId = ownerId;
  if (status && (STATUSES as string[]).includes(status)) where.status = status as ProposalStatus;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const [rows, total] = await Promise.all([
    prisma.proposalItinerary.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        status: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { name: true } },
      },
    }),
    prisma.proposalItinerary.count({ where }),
  ]);

  return {
    total,
    items: rows.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      ownerId: i.ownerId,
      ownerName: i.owner?.name ?? null,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })),
  };
}

// Deliberately global (not per-owner): two staff quoting the same customer the
// same trip is exactly the duplicate this guards against.
export async function proposalTitleExists(title: string, excludeId?: string): Promise<boolean> {
  const match = await prisma.proposalItinerary.findFirst({
    where: {
      title: { equals: title, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return match !== null;
}
