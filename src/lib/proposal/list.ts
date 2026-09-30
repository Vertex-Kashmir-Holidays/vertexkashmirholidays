import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { STALE_COPY_MS, isCopyTitle } from "@/lib/itinerary/documentTitle";
import {
  SINGLE_TIER_KEY,
  TIER_ORDER,
  type ProposalSummary,
  type ProposalStatus,
} from "@/types/proposal";

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
  await purgeStaleProposalCopies();
  const where: Prisma.ProposalItineraryWhereInput = {};
  if (ownerId) where.ownerId = ownerId;
  if (status && (STATUSES as string[]).includes(status)) where.status = status as ProposalStatus;
  // Title, or the customer's name/phone stored in the proposal content —
  // staff following up often only have the number to hand.
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { data: { path: ["customerPhone"], string_contains: search } },
      { data: { path: ["preparedFor"], string_contains: search } },
    ];
  }

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
        // Only two short strings are read from it, but Prisma can't select
        // JSON sub-paths — acceptable at this list's page size.
        data: true,
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
      ...customerFrom(i.data),
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })),
  };
}

function customerFrom(data: Prisma.JsonValue): {
  customerName: string;
  customerPhone: string;
  packageCosts: { label: string; price: string }[];
} {
  const obj = (v: unknown) =>
    (v && typeof v === "object" && !Array.isArray(v) ? v : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const d = obj(data);
  const tiers = obj(d.tiers);
  // Same tier selection as the PDF cover's price boxes.
  const keys = d.docType === "single" ? [SINGLE_TIER_KEY] : TIER_ORDER;
  const packageCosts = keys
    .map((k) => ({ label: str(obj(tiers[k]).label), price: str(obj(tiers[k]).priceLabel) }))
    .filter((c) => c.price);
  return { customerName: str(d.preparedFor), customerPhone: str(d.customerPhone), packageCosts };
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

// Backstop for copies abandoned without the editor's leave hook firing — see
// purgeStaleItineraryCopies in src/lib/itinerary/list.ts.
async function purgeStaleProposalCopies() {
  const candidates = await prisma.proposalItinerary.findMany({
    where: {
      title: { contains: " - copy", mode: "insensitive" },
      updatedAt: { lt: new Date(Date.now() - STALE_COPY_MS) },
    },
    select: { id: true, title: true },
  });
  const ids = candidates.filter((c) => isCopyTitle(c.title)).map((c) => c.id);
  if (ids.length) await prisma.proposalItinerary.deleteMany({ where: { id: { in: ids } } });
}
