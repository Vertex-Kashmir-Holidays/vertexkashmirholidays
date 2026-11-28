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
  /** Visibility scope — see proposalWhereForUser (admins: all; others: own + assigned). */
  scope: Prisma.ProposalItineraryWhereInput;
  /** Title or customer name. */
  search?: string;
  /** Customer phone — digits only are compared, so spacing/dashes don't matter. */
  phone?: string;
  /** Owner user id. */
  createdBy?: string;
  /** Assignee user id, or "UNASSIGNED". */
  assignedTo?: string;
  /** "ALL" (or anything unrecognised) means no status filter. */
  status?: string;
  page: number;
  pageSize: number;
}

export async function listProposalSummaries({
  scope,
  search,
  phone,
  createdBy,
  assignedTo,
  status,
  page,
  pageSize,
}: ListOptions): Promise<{ items: ProposalSummary[]; total: number }> {
  await purgeStaleProposalCopies();
  const and: Prisma.ProposalItineraryWhereInput[] = [scope];
  if (status && (STATUSES as string[]).includes(status)) and.push({ status: status as ProposalStatus });
  if (createdBy) and.push({ ownerId: createdBy });
  if (assignedTo) and.push({ assignedToId: assignedTo === "UNASSIGNED" ? null : assignedTo });
  // Title (it carries the name) or the customer name in the proposal content.
  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { data: { path: ["preparedFor"], string_contains: search } },
      ],
    });
  }
  // Phones are typed every which way ("+91 -98855 12303"), so compare digits
  // only — the stored phone, or the title (which ends with it).
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (digits) {
    const hits = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "ProposalItinerary"
      WHERE regexp_replace(coalesce(data->>'customerPhone', '') || ' ' || title, '\\D', '', 'g') LIKE ${`%${digits}%`}`;
    and.push({ id: { in: hits.map((h) => h.id) } });
  }
  const where: Prisma.ProposalItineraryWhereInput = { AND: and };

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
        assignedToId: true,
        assignedTo: { select: { name: true } },
        // Only a few short strings are read from it, but Prisma can't select
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
      assignedToId: i.assignedToId,
      assignedToName: i.assignedTo?.name ?? null,
      ...customerFrom(i.data),
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })),
  };
}

function customerFrom(data: Prisma.JsonValue): {
  customerName: string;
  customerPhone: string;
  travelDates: string;
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
  return {
    customerName: str(d.preparedFor),
    customerPhone: str(d.customerPhone),
    travelDates: str(d.travelDates),
    packageCosts,
  };
}

/** People for the Created By / Assigned To filters — only those on proposals this user can see. */
export async function listProposalPeople(scope: Prisma.ProposalItineraryWhereInput) {
  const [owners, assignees] = await Promise.all([
    prisma.proposalItinerary.findMany({
      where: scope,
      distinct: ["ownerId"],
      select: { owner: { select: { id: true, name: true, email: true } } },
    }),
    prisma.proposalItinerary.findMany({
      where: { AND: [scope, { assignedToId: { not: null } }] },
      distinct: ["assignedToId"],
      select: { assignedTo: { select: { id: true, name: true, email: true } } },
    }),
  ]);
  const toOption = (u: { id: string; name: string | null; email: string }) => ({ id: u.id, name: u.name ?? u.email });
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  return {
    creators: owners.flatMap((o) => (o.owner ? [toOption(o.owner)] : [])).sort(byName),
    assignees: assignees.flatMap((a) => (a.assignedTo ? [toOption(a.assignedTo)] : [])).sort(byName),
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
