import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ItinerarySummary, ItineraryStatus } from "@/types/itinerary";
import {
  STALE_COPY_MS,
  buildDocumentTitle,
  isCopyTitle,
  uniqueTitle,
} from "@/lib/itinerary/documentTitle";

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
  await purgeStaleItineraryCopies();
  const where: Prisma.ItineraryWhereInput = {
    // B2B itineraries are edited at /admin/b2b-itineraries/[id]; the standard
    // editor and API 404 on them, so listing them here only yields dead links.
    NOT: { lead: { is: { b2bAgentId: { not: null } } } },
  };
  if (ownerId) where.ownerId = ownerId;
  if (status && (STATUSES as string[]).includes(status)) where.status = status as ItineraryStatus;
  // Title, or the customer's name/phone (stored in the itinerary content, or
  // on the linked lead/booking) — staff following up often only have the number.
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { data: { path: ["customerPhone"], string_contains: search } },
      { data: { path: ["preparedFor"], string_contains: search } },
      { lead: { is: { phone: { contains: search } } } },
      { booking: { is: { guestPhone: { contains: search } } } },
    ];
  }

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
        // Customer name/phone + quoted total live in `data` (Prisma can't
        // select JSON sub-paths — fine at this list's page size); the linked
        // lead/booking phone is the fallback for itineraries created before
        // the customer phone field existed.
        data: true,
        lead: { select: { phone: true } },
        booking: { select: { guestPhone: true } },
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
      ...customerFrom(i.data, i.lead?.phone ?? i.booking?.guestPhone ?? ""),
    })),
  };
}

// "Rs 0/-" is the placeholder new lead itineraries start with — not a quote.
// Also catches "Rs 00,00/-"-style zero placeholders typed by hand.
const ZERO_COST = /^\s*(rs\.?|inr\.?|₹)?\s*[0,]+(\.0+)?\s*\/?-?\s*$/i;

/** An itinerary's quoted total ("" when unset or still the "Rs 0/-" placeholder). */
export function itineraryQuotedCost(data: Prisma.JsonValue | undefined): string {
  const d = (data && typeof data === "object" && !Array.isArray(data) ? data : {}) as Record<
    string,
    unknown
  >;
  const cost = typeof d.totalCost === "string" ? d.totalCost.trim() : "";
  return ZERO_COST.test(cost) ? "" : cost;
}

function customerFrom(
  data: Prisma.JsonValue,
  fallbackPhone: string,
): { customerName: string; customerPhone: string; totalCost: string } {
  const d = (data && typeof data === "object" && !Array.isArray(data) ? data : {}) as Record<
    string,
    unknown
  >;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    customerName: str(d.preparedFor),
    customerPhone: str(d.customerPhone) || fallbackPhone.trim(),
    totalCost: itineraryQuotedCost(data),
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

/**
 * Standard, unique title for itineraries whose name the system assigns
 * (lead/booking/B2B-linked) — a clash gets a " (2)" suffix instead of a 409,
 * since the lead/booking link already identifies the record.
 */
export function uniqueItineraryTitle(
  data: Parameters<typeof buildDocumentTitle>[0],
  excludeId?: string,
): Promise<string> {
  return uniqueTitle(buildDocumentTitle(data), (t) => itineraryTitleExists(t, excludeId));
}

// Backstop for copies abandoned without the editor's leave hook firing (crash,
// lost connection): a copy is only renamed by a successful save, so one still
// titled "… - copy" after STALE_COPY_MS was never updated.
async function purgeStaleItineraryCopies() {
  const candidates = await prisma.itinerary.findMany({
    where: {
      leadId: null,
      bookingId: null,
      title: { contains: " - copy", mode: "insensitive" },
      updatedAt: { lt: new Date(Date.now() - STALE_COPY_MS) },
    },
    select: { id: true, title: true },
  });
  const ids = candidates.filter((c) => isCopyTitle(c.title)).map((c) => c.id);
  if (ids.length) await prisma.itinerary.deleteMany({ where: { id: { in: ids } } });
}
