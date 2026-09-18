// Single source of truth for "which bookings count as a completed tour" and
// every per-booking number the Finance module shows for one. Used by both
// the completed-bookings list route and its summary/chart route (and the P&L
// overview) so none of them can ever compute a different number for the same
// booking — see .ai/skills/booking-finance.md.
//
// Reuses the existing finance/GST/profit utilities verbatim:
//   - computeBookingFinance (src/lib/bookings/finance.ts) for bookingAmount,
//     discount, effectivePayable, paidAmount, servicesTotal, paymentStatus.
//   - computeBookingProfit/computeGstDeduction (src/lib/bookings/commission.ts)
//     for the Profit figure — identical formula to sales commission, floored
//     at zero, deliberately not a second/unclamped variant.
//   - isCashMethod (src/lib/payments/gst.ts) to split payments into
//     online/bank vs cash, the same distinction the app already uses.
//
// "Completed tour" is NOT a persisted BookingStatus value (none represents
// trip lifecycle — see .ai/context/business-rules.md → Booking Rules). It is
// derived here, deliberately going slightly further than the existing
// isBookingCompleted() helper in finance.ts (which only gates Cancel/Refund
// CTA visibility and must not change behavior for those callers):
//   - excludes CANCELLED/REFUNDED/FAILED explicitly, rather than relying on
//     those rarely reaching paymentStatus "FULL" on their own.
//   - uses travelEndDate (falling back to travelDate) so a still-ongoing
//     multi-day tour is never counted, not just one that hasn't started.

import { Prisma, BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeBookingFinance, round2 } from "@/lib/bookings/finance";
import { computeBookingProfit, computeGstDeduction } from "@/lib/bookings/commission";
import { isCashMethod } from "@/lib/payments/gst";

const EXCLUDED_STATUSES: BookingStatus[] = ["CANCELLED", "REFUNDED", "FAILED"];

export type DateFilterField = "travelDate" | "createdAt";

export interface CompletedBookingFilters {
  dateField?: DateFilterField;
  dateFrom?: Date;
  dateTo?: Date;
  /** A User.id, or "direct" for bookings with no assigned salesperson. */
  salespersonId?: string;
  /** A Tour.id, or "custom" for bookings with no tour (lead-converted/custom itinerary). */
  tourId?: string;
  paymentMode?: "online" | "cash";
  /** Matches guestName / guestEmail / guestPhone. */
  customer?: string;
  /** Matches booking id / razorpayOrderId / guestName / guestEmail. */
  search?: string;
}

export interface CompletedBookingRow {
  id: string;
  status: BookingStatus;
  travelDate: Date;
  travelEndDate: Date | null;
  createdAt: Date;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string;
  tourId: string | null;
  tourTitle: string | null;
  salespersonId: string | null;
  salesperson: string | null;
  bookingTotal: number; // effectivePayable — after discount
  serviceCost: number; // servicesTotal
  onlineAmount: number;
  cashAmount: number;
  gstAmount: number; // net of REFUND rows, same convention as commission.ts
  profit: number; // computeBookingProfit — floored at 0
  paidAmount: number;
}

const SELECT = {
  id: true,
  status: true,
  amount: true,
  discountType: true,
  discountValue: true,
  travelDate: true,
  travelEndDate: true,
  createdAt: true,
  guestName: true,
  guestEmail: true,
  guestPhone: true,
  tourId: true,
  tour: { select: { title: true } },
  leads: {
    take: 1 as const,
    select: { assignedTo: { select: { id: true, name: true, email: true } } },
  },
  payments: { select: { amount: true, type: true, method: true, gstAmount: true } },
  services: { select: { amount: true } },
} satisfies Prisma.BookingSelect;

type RawBooking = Prisma.BookingGetPayload<{ select: typeof SELECT }>;

function isTourCompleted(b: RawBooking): boolean {
  if (EXCLUDED_STATUSES.includes(b.status)) return false;
  const endBoundary = (b.travelEndDate ?? b.travelDate).getTime();
  if (endBoundary >= Date.now()) return false;
  const finance = computeBookingFinance({
    amount: b.amount,
    discountType: b.discountType,
    discountValue: b.discountValue,
    payments: b.payments,
    services: [],
  });
  return finance.paymentStatus === "FULL";
}

function reduceRow(b: RawBooking): CompletedBookingRow {
  const finance = computeBookingFinance({
    amount: b.amount,
    discountType: b.discountType,
    discountValue: b.discountValue,
    payments: b.payments,
    services: b.services,
  });
  const gstDeduction = computeGstDeduction(b.payments);
  const profit = computeBookingProfit(finance, gstDeduction);

  let onlineAmount = 0;
  let cashAmount = 0;
  for (const p of b.payments) {
    const signed = p.type === "REFUND" ? -p.amount : p.amount;
    if (isCashMethod(p.method)) cashAmount += signed;
    else onlineAmount += signed;
  }

  const assignedTo = b.leads[0]?.assignedTo ?? null;

  return {
    id: b.id,
    status: b.status,
    travelDate: b.travelDate,
    travelEndDate: b.travelEndDate,
    createdAt: b.createdAt,
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    guestPhone: b.guestPhone,
    tourId: b.tourId,
    tourTitle: b.tour?.title ?? null,
    salespersonId: assignedTo?.id ?? null,
    salesperson: assignedTo?.name ?? assignedTo?.email ?? null,
    bookingTotal: finance.effectivePayable,
    serviceCost: finance.servicesTotal,
    onlineAmount: round2(onlineAmount),
    cashAmount: round2(cashAmount),
    gstAmount: gstDeduction,
    profit,
    paidAmount: finance.paidAmount,
  };
}

/**
 * Every completed booking matching the given filters, fully reduced to
 * Finance's row shape. The one query every Finance route builds on — never
 * re-derive bookingTotal/serviceCost/GST/profit independently elsewhere.
 */
export async function getCompletedBookings(
  filters: CompletedBookingFilters = {},
): Promise<CompletedBookingRow[]> {
  const dateField = filters.dateField ?? "travelDate";
  const where: Prisma.BookingWhereInput = {
    deletedAt: null,
    status: { notIn: EXCLUDED_STATUSES },
    ...(filters.dateFrom || filters.dateTo
      ? {
          [dateField]: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
          },
        }
      : {}),
    ...(filters.tourId === "custom"
      ? { tourId: null }
      : filters.tourId
        ? { tourId: filters.tourId }
        : {}),
    ...(filters.customer
      ? {
          OR: [
            { guestName: { contains: filters.customer, mode: "insensitive" } },
            { guestEmail: { contains: filters.customer, mode: "insensitive" } },
            { guestPhone: { contains: filters.customer } },
          ],
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { id: filters.search },
            { razorpayOrderId: { contains: filters.search } },
            { guestName: { contains: filters.search, mode: "insensitive" } },
            { guestEmail: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.booking.findMany({ where, select: SELECT });
  let completed = rows.filter(isTourCompleted).map(reduceRow);

  if (filters.salespersonId === "direct") {
    completed = completed.filter((r) => !r.salespersonId);
  } else if (filters.salespersonId) {
    completed = completed.filter((r) => r.salespersonId === filters.salespersonId);
  }
  if (filters.paymentMode === "online") completed = completed.filter((r) => r.onlineAmount > 0);
  if (filters.paymentMode === "cash") completed = completed.filter((r) => r.cashAmount > 0);

  return completed;
}

export interface CompletedBookingCards {
  totalBookingAmount: number;
  totalOnlineAmount: number;
  totalCashAmount: number;
  totalGst: number;
  totalProfit: number;
  count: number;
}

export function summarizeCards(rows: CompletedBookingRow[]): CompletedBookingCards {
  return rows.reduce(
    (acc, r) => ({
      totalBookingAmount: round2(acc.totalBookingAmount + r.bookingTotal),
      totalOnlineAmount: round2(acc.totalOnlineAmount + r.onlineAmount),
      totalCashAmount: round2(acc.totalCashAmount + r.cashAmount),
      totalGst: round2(acc.totalGst + r.gstAmount),
      totalProfit: round2(acc.totalProfit + r.profit),
      count: acc.count + 1,
    }),
    { totalBookingAmount: 0, totalOnlineAmount: 0, totalCashAmount: 0, totalGst: 0, totalProfit: 0, count: 0 },
  );
}

export interface MonthlyPoint {
  month: string; // "YYYY-MM"
  revenue: number;
  cost: number;
  profit: number;
  online: number;
  cash: number;
  gst: number;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * A trend chart with only one real data point renders as a lone dot (no line
 * can be drawn) or a single bar stretched across the whole width — not
 * readable. Pad out to a fixed trailing window of months (ending at the
 * latest month with data, or the current month if there's none at all) so
 * every trend chart always has enough points to actually show a trend.
 */
export function monthWindow(observedMonths: string[], minSpan = 6): string[] {
  const end = observedMonths.length
    ? observedMonths.reduce((a, b) => (a > b ? a : b))
    : monthKey(new Date());
  const [y, m] = end.split("-").map(Number);
  const months: string[] = [];
  for (let i = minSpan - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    months.push(monthKey(d));
  }
  return months;
}

/** Buckets rows by month of `dateField` (travelDate by default) for the trend charts. */
export function buildMonthlySeries(
  rows: CompletedBookingRow[],
  dateField: DateFilterField = "travelDate",
): MonthlyPoint[] {
  const buckets = new Map<string, MonthlyPoint>();
  for (const r of rows) {
    const key = monthKey(dateField === "createdAt" ? r.createdAt : r.travelDate);
    const point = buckets.get(key) ?? { month: key, revenue: 0, cost: 0, profit: 0, online: 0, cash: 0, gst: 0 };
    point.revenue = round2(point.revenue + r.bookingTotal);
    point.cost = round2(point.cost + r.serviceCost);
    point.profit = round2(point.profit + r.profit);
    point.online = round2(point.online + r.onlineAmount);
    point.cash = round2(point.cash + r.cashAmount);
    point.gst = round2(point.gst + r.gstAmount);
    buckets.set(key, point);
  }
  return monthWindow([...buckets.keys()]).map(
    (month) => buckets.get(month) ?? { month, revenue: 0, cost: 0, profit: 0, online: 0, cash: 0, gst: 0 },
  );
}

export interface TourAggregate {
  tourId: string | null;
  tourTitle: string;
  revenue: number;
  profit: number;
  count: number;
}

export function topToursByRevenue(rows: CompletedBookingRow[], limit = 5): TourAggregate[] {
  const buckets = new Map<string, TourAggregate>();
  for (const r of rows) {
    const key = r.tourId ?? "custom";
    const agg = buckets.get(key) ?? {
      tourId: r.tourId,
      tourTitle: r.tourTitle ?? "Custom Itinerary",
      revenue: 0,
      profit: 0,
      count: 0,
    };
    agg.revenue = round2(agg.revenue + r.bookingTotal);
    agg.profit = round2(agg.profit + r.profit);
    agg.count += 1;
    buckets.set(key, agg);
  }
  return [...buckets.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}
