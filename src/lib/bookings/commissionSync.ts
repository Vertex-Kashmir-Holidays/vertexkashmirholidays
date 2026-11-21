// Recomputes a booking's commission row after anything that can change its
// profit (services locked, a payment created/edited/deleted) or its payment
// status. Called from lock-services and the payments routes — never duplicate
// this recompute logic at the call sites.
//
// EXPECTED → EARNED (business rule, 2026-11-15): only once the booking is
// paid in full AND the tour is completed (its last day has passed, IST).
// earnedAt = the tour's last day, so the incentive lands in the payroll of the
// month the tour completed — disbursed by the 10th of the following month.
// Completion happens with the passing of time, not an edit, so
// refreshOpenCommissions() re-checks open rows (payroll prep, bookings page).

import type { prisma as prismaClient } from "@/lib/prisma";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { computeGstDeduction, computeBookingProfit, computeCommission } from "@/lib/bookings/commission";
import { todayIst } from "@/lib/trips/board";

type Db = Pick<typeof prismaClient, "booking" | "bookingCommission" | "user">;

/** Tour's last day (stored at UTC midnight): the end date, else the start date. */
function tourLastDay(b: { travelDate: Date; travelEndDate: Date | null }): Date {
  return b.travelEndDate ?? b.travelDate;
}

/** True once the tour's last day is over in IST. */
export function isTourCompleted(b: { travelDate: Date; travelEndDate: Date | null }, now = new Date()): boolean {
  return tourLastDay(b).toISOString().slice(0, 10) < todayIst(now);
}

export async function syncBookingCommission(db: Db, bookingId: string): Promise<void> {
  let commission = await db.bookingCommission.findUnique({ where: { bookingId } });
  // PAID = money already handed over; REVERSED = booking was cancelled/refunded.
  // Neither should be silently rewritten by a later services/payment edit.
  if (commission && (commission.status === "PAID" || commission.status === "REVERSED")) return;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      amount: true,
      travelDate: true,
      travelEndDate: true,
      discountType: true,
      discountValue: true,
      payments: { select: { amount: true, type: true, gstAmount: true } },
      services: { select: { amount: true } },
      leads: { take: 1, select: { assignedToId: true } },
    },
  });
  if (!booking) return;

  // No row yet — happens for a direct/website booking (no lead, nothing to
  // credit), or a lead-converted booking whose salesperson had no
  // `bookingConversionPct` set at conversion time. If a rate has since been
  // configured, create the row now so the booking isn't permanently lost from
  // commission tracking — the rate is still only ever snapshotted once, here.
  if (!commission) {
    const employeeId = booking.leads[0]?.assignedToId;
    if (!employeeId) return;
    const employee = await db.user.findUnique({
      where: { id: employeeId },
      select: { bookingConversionPct: true },
    });
    const ratePct = employee?.bookingConversionPct;
    if (ratePct == null || ratePct <= 0) return;
    commission = await db.bookingCommission.create({
      data: { bookingId, employeeId, rateSnapshotPct: ratePct },
    });
  }

  const finance = computeBookingFinance({
    amount: booking.amount,
    discountType: booking.discountType,
    discountValue: booking.discountValue,
    payments: booking.payments,
    services: booking.services,
  });
  const profitAmount = computeBookingProfit(finance, computeGstDeduction(booking.payments));
  const commissionAmount = computeCommission(profitAmount, commission.rateSnapshotPct);
  // A row already claimed by a payroll run stays EARNED in that month.
  const claimed = commission.salaryRecordId != null;
  const earned = claimed || (finance.paymentStatus === "FULL" && isTourCompleted(booking));
  const status = earned ? "EARNED" : "EXPECTED";
  const earnedAt = claimed ? commission.earnedAt : earned ? tourLastDay(booking) : null;

  const unchanged =
    commission.profitAmount === profitAmount &&
    commission.commissionAmount === commissionAmount &&
    commission.status === status &&
    (commission.earnedAt?.getTime() ?? null) === (earnedAt?.getTime() ?? null);
  if (unchanged) return;

  await db.bookingCommission.update({
    where: { bookingId },
    data: { profitAmount, commissionAmount, status, earnedAt },
  });
}

/**
 * Re-check an employee's open (unclaimed EXPECTED/EARNED) commissions, so a
 * tour that completed since the last edit becomes EARNED — and one marked
 * EARNED before the tour ended goes back to EXPECTED. Rows that didn't change
 * aren't written.
 */
export async function refreshOpenCommissions(db: Db, employeeId: string): Promise<void> {
  const open = await db.bookingCommission.findMany({
    where: { employeeId, salaryRecordId: null, status: { in: ["EXPECTED", "EARNED"] } },
    select: { bookingId: true },
  });
  for (const c of open) await syncBookingCommission(db, c.bookingId);
}

/**
 * Credit follows the lead's current assignee: when a converted lead is
 * reassigned, its booking's commission moves to the new assignee at their own
 * conversion rate (re-snapshotted), then is recomputed. Settled commission —
 * PAID, REVERSED, or already claimed by a payroll run — never moves. A new
 * assignee without a conversion rate means no commission row.
 */
export async function moveBookingCommission(
  db: Db,
  bookingId: string,
  employeeId: string | null,
): Promise<void> {
  const commission = await db.bookingCommission.findUnique({ where: { bookingId } });
  if (commission) {
    const settled =
      commission.status === "PAID" || commission.status === "REVERSED" || commission.salaryRecordId != null;
    if (settled || commission.employeeId === employeeId) return;
    const employee = employeeId
      ? await db.user.findUnique({ where: { id: employeeId }, select: { bookingConversionPct: true } })
      : null;
    const ratePct = employee?.bookingConversionPct;
    if (!employeeId || ratePct == null || ratePct <= 0) {
      await db.bookingCommission.delete({ where: { bookingId } });
      return;
    }
    await db.bookingCommission.update({
      where: { bookingId },
      data: { employeeId, rateSnapshotPct: ratePct },
    });
  }
  // Recompute — also creates the row for the new assignee when there was none.
  await syncBookingCommission(db, bookingId);
}
