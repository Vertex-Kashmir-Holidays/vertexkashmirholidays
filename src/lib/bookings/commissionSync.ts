// Recomputes a booking's commission row after anything that can change its
// profit (services locked, a payment created/edited/deleted) or its payment
// status (which decides EXPECTED → EARNED). Called from lock-services and the
// payments routes — never duplicate this recompute logic at the call sites.

import type { prisma as prismaClient } from "@/lib/prisma";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { computeGstDeduction, computeBookingProfit, computeCommission } from "@/lib/bookings/commission";

type Db = Pick<typeof prismaClient, "booking" | "bookingCommission" | "user">;

export async function syncBookingCommission(db: Db, bookingId: string): Promise<void> {
  let commission = await db.bookingCommission.findUnique({ where: { bookingId } });
  // PAID = money already handed over; REVERSED = booking was cancelled/refunded.
  // Neither should be silently rewritten by a later services/payment edit.
  if (commission && (commission.status === "PAID" || commission.status === "REVERSED")) return;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      amount: true,
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
  const earned = finance.paymentStatus === "FULL";

  await db.bookingCommission.update({
    where: { bookingId },
    data: {
      profitAmount,
      commissionAmount,
      ...(earned
        ? { status: "EARNED", earnedAt: commission.earnedAt ?? new Date() }
        : { status: "EXPECTED" }),
    },
  });
}
