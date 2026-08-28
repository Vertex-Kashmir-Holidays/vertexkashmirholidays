// Auto-expiry for abandoned booking checkouts. A Booking row is created in
// PENDING status before Razorpay payment completes (see create-order/route.ts),
// specifically so a customer can retry an abandoned checkout without a
// duplicate. If payment never happens, that row would otherwise sit in the DB
// forever as junk data — this sweeps it into CANCELLED after a short window.

import { prisma } from "@/lib/prisma";

export const STALE_BOOKING_MINUTES = 30;

/**
 * Best-effort: soft-cancel PENDING bookings older than STALE_BOOKING_MINUTES
 * with no recorded payment. Never throws — cleanup must not block the caller.
 */
export async function cleanupStalePendingBookings(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - STALE_BOOKING_MINUTES * 60 * 1000);
    await prisma.booking.updateMany({
      where: {
        status: "PENDING",
        deletedAt: null,
        createdAt: { lt: cutoff },
        payments: { none: {} },
      },
      data: { status: "CANCELLED", deletedAt: new Date() },
    });
  } catch (err) {
    console.error("[bookings] stale-PENDING cleanup failed:", err);
  }
}
