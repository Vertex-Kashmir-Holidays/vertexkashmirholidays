import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ItinerarySummary, ItineraryStatus } from "@/types/itinerary";

const STATUSES: ItineraryStatus[] = ["DRAFT", "SENT", "CONFIRMED"];

interface ListOptions {
  /** Set for non-admins — they only ever see their own itineraries. */
  ownerId?: string;
  search?: string;
  /** "ALL" (or anything unrecognised) means no status filter. */
  status?: string;
  page: number;
  pageSize: number;
}

export async function listItinerarySummaries({
  ownerId,
  search,
  status,
  page,
  pageSize,
}: ListOptions): Promise<{ items: ItinerarySummary[]; total: number }> {
  const where: Prisma.ItineraryWhereInput = {};
  if (ownerId) where.ownerId = ownerId;
  if (status && (STATUSES as string[]).includes(status)) where.status = status as ItineraryStatus;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const [rows, total] = await Promise.all([
    prisma.itinerary.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        status: true,
        ownerId: true,
        leadId: true,
        bookingId: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { name: true } },
      },
    }),
    prisma.itinerary.count({ where }),
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
      linked: !!i.leadId || !!i.bookingId,
    })),
  };
}

// Deliberately global (not per-owner): two staff quoting the same customer the
// same trip is exactly the duplicate this guards against.
export async function itineraryTitleExists(title: string, excludeId?: string): Promise<boolean> {
  const match = await prisma.itinerary.findFirst({
    where: {
      title: { equals: title, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return match !== null;
}
