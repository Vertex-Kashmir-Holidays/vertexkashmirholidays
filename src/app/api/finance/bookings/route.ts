import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getCompletedBookings, type CompletedBookingFilters, type DateFilterField } from "@/lib/finance/completedBookings";

export const dynamic = "force-dynamic";

type SortKey = "travelDate" | "createdAt" | "bookingTotal" | "profit" | "gstAmount";
const SORT_KEYS: SortKey[] = ["travelDate", "createdAt", "bookingTotal", "profit", "gstAmount"];

/**
 * Completed-bookings list for the Finance dashboard table. Filters, sorts,
 * and paginates over the single shared reduction from
 * src/lib/finance/completedBookings.ts — the same rows the summary/chart
 * route (and its cards) are built from, so the table and the cards can never
 * disagree for the same filter set.
 */
export async function GET(req: NextRequest) {
  const guard = await requirePermission("finance", "view");
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const dateField: DateFilterField = searchParams.get("dateField") === "createdAt" ? "createdAt" : "travelDate";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const filters: CompletedBookingFilters = {
    dateField,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    salespersonId: searchParams.get("salespersonId") ?? undefined,
    tourId: searchParams.get("tourId") ?? undefined,
    paymentMode: searchParams.get("paymentMode") === "online" || searchParams.get("paymentMode") === "cash"
      ? (searchParams.get("paymentMode") as "online" | "cash")
      : undefined,
    customer: searchParams.get("customer")?.trim() || undefined,
    search: searchParams.get("search")?.trim() || undefined,
  };

  const rawSortBy = searchParams.get("sortBy") as SortKey | null;
  const sortBy: SortKey = rawSortBy && SORT_KEYS.includes(rawSortBy) ? rawSortBy : "travelDate";
  const sortDir = searchParams.get("sortDir") === "asc" ? 1 : -1;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));

  const all = await getCompletedBookings(filters);
  all.sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    const cmp = av instanceof Date && bv instanceof Date ? av.getTime() - bv.getTime() : Number(av) - Number(bv);
    return cmp * sortDir;
  });

  const total = all.length;
  const start = (page - 1) * pageSize;
  const bookings = all.slice(start, start + pageSize);

  return NextResponse.json({ bookings, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) });
}
