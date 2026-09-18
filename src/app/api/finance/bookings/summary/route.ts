import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import {
  getCompletedBookings,
  summarizeCards,
  buildMonthlySeries,
  topToursByRevenue,
  type CompletedBookingFilters,
  type DateFilterField,
} from "@/lib/finance/completedBookings";

export const dynamic = "force-dynamic";

/**
 * Summary cards + monthly chart series + top tours for the Finance dashboard.
 * Built from the exact same filtered row set as GET /api/finance/bookings —
 * cards and table can never drift apart for the same filters.
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

  const rows = await getCompletedBookings(filters);
  const cards = summarizeCards(rows);
  const monthlySeries = buildMonthlySeries(rows, dateField);
  const topTours = topToursByRevenue(rows, 5);

  return NextResponse.json({ cards, monthlySeries, topTours });
}
