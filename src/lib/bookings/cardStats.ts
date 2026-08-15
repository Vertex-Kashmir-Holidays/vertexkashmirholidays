// Server-side aggregation for the bookings-page summary cards. Reuses
// computeBookingFinance / computeBookingProfit as the single source of truth —
// never re-derives the profit formula here. Scoped through bookingWhereForUser
// so a salesperson's totals only ever include bookings they're authorized to see.
//
// Query-cost notes (small-team app, keep DB load low):
//   - CANCELLED/REFUNDED bookings are excluded via the Prisma `where` itself,
//     not fetched-then-discarded in JS — their payments/services never cross
//     the wire for a booking that will just be thrown away.
//   - Cancelled counts use plain indexed `count()`, no row/relation fetch.
//   - Commission sums (sales only — admin runs no commission query at all)
//     use one `groupBy` (EARNED + PAID all-time in one round trip) + two
//     single-column `aggregate()` calls for the month splits.

import { prisma } from "@/lib/prisma";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { computeGstDeduction, computeBookingProfit } from "@/lib/bookings/commission";
import type { Role } from "@/lib/rbac";

export interface BookingCardStats {
  isAdmin: boolean;
  bookingsCount: { all: number; month: number };
  bookingsTotal: { all: number; month: number };
  cancelledBookings: { all: number; month: number };
  // Admin only — profit is not exposed to sales users at all (not just hidden in the UI).
  bookingsProfit?: { all: number; month: number };
  // Sales only.
  myCommission?: { all: number; month: number }; // status EARNED — booking paid in full, not yet settled to the employee
  paidCommission?: { all: number; month: number }; // status PAID — actually settled ("Earned Commission" card)
}

function monthStart(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

interface RowForSummary {
  amount: number;
  discountType: string | null;
  discountValue: number;
  createdAt: Date;
  payments: { amount: number; type: string | null; gstAmount: number | null }[];
  services: { amount: number }[];
}

function summarize(rows: RowForSummary[]) {
  let total = 0;
  let profit = 0;
  for (const b of rows) {
    const finance = computeBookingFinance({
      amount: b.amount,
      discountType: b.discountType,
      discountValue: b.discountValue,
      payments: b.payments,
      services: b.services,
    });
    total += b.amount;
    profit += computeBookingProfit(finance, computeGstDeduction(b.payments));
  }
  return { count: rows.length, total, profit };
}

export async function getBookingCardStats(role: Role, userId: string): Promise<BookingCardStats> {
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";
  const start = monthStart();
  const scope = { deletedAt: null, ...bookingWhereForUser(role, userId) };

  const [activeRows, cancelledAll, cancelledMonth] = await Promise.all([
    // CANCELLED + REFUNDED are both inactive for sales/commission purposes — a
    // refunded booking's token amount doesn't make it commissionable, same as
    // a cancelled one. Excluded here, in SQL, not after fetching.
    prisma.booking.findMany({
      where: { ...scope, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      select: {
        amount: true,
        discountType: true,
        discountValue: true,
        createdAt: true,
        payments: { select: { amount: true, type: true, gstAmount: true } },
        services: { select: { amount: true } },
      },
    }),
    // The "Cancelled Bookings" card itself counts CANCELLED only, per its label.
    prisma.booking.count({ where: { ...scope, status: "CANCELLED" } }),
    prisma.booking.count({ where: { ...scope, status: "CANCELLED", createdAt: { gte: start } } }),
  ]);

  const all = summarize(activeRows);
  const month = summarize(activeRows.filter((b) => b.createdAt >= start));

  const stats: BookingCardStats = {
    isAdmin,
    bookingsCount: { all: all.count, month: month.count },
    bookingsTotal: { all: all.total, month: month.total },
    cancelledBookings: { all: cancelledAll, month: cancelledMonth },
  };

  if (isAdmin) {
    // Profit is admin-only — not attached to the response at all for sales.
    stats.bookingsProfit = { all: all.profit, month: month.profit };
  } else {
    const [byStatus, earnedMonth, paidMonth] = await Promise.all([
      prisma.bookingCommission.groupBy({
        by: ["status"],
        where: { employeeId: userId, status: { in: ["EARNED", "PAID"] } },
        _sum: { commissionAmount: true },
      }),
      prisma.bookingCommission.aggregate({
        where: { employeeId: userId, status: "EARNED", earnedAt: { gte: start } },
        _sum: { commissionAmount: true },
      }),
      prisma.bookingCommission.aggregate({
        where: { employeeId: userId, status: "PAID", paidAt: { gte: start } },
        _sum: { commissionAmount: true },
      }),
    ]);
    const sumFor = (status: string) =>
      byStatus.find((r) => r.status === status)?._sum.commissionAmount ?? 0;

    stats.myCommission = { all: sumFor("EARNED"), month: earnedMonth._sum.commissionAmount ?? 0 };
    stats.paidCommission = { all: sumFor("PAID"), month: paidMonth._sum.commissionAmount ?? 0 };
  }

  return stats;
}
