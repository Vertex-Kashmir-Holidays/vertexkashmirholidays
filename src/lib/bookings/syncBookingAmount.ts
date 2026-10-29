import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeBookingFinance } from "@/lib/bookings/finance";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Extract a numeric amount from the itinerary's free-form "total cost" string
 * (e.g. "Rs 30,500/-" → 30500). Returns null when no positive number is present.
 * Used to keep the lead's negotiated amount in sync with the proposed price.
 */
export function parseProposedAmount(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const n = parseFloat(digits);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/**
 * A converted lead's price (its itinerary's total cost, or the lead's
 * negotiated amount) can be edited again once an admin unlocks the booking
 * (see unlock-services). The booking's amount is what its summary, invoice and
 * commission use, so it must follow that edit — otherwise the booking keeps
 * the price agreed at conversion.
 *
 * Call BEFORE the lead's negotiatedAmount is updated. Returns the booking
 * update to run in the caller's transaction (null when there is nothing to
 * sync: lead not converted, booking locked, or the price didn't change),
 * or an error when the new price is below what's already paid or the services
 * total — the same floor as editing the amount on the booking itself.
 */
export async function convertedBookingAmountUpdate(
  leadId: string,
  amount: number,
): Promise<{ op: Prisma.PrismaPromise<unknown> | null; error: string | null }> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      status: true,
      negotiatedAmount: true,
      booking: {
        select: {
          id: true,
          amount: true,
          servicesLocked: true,
          deletedAt: true,
          payments: { select: { amount: true, type: true } },
          services: { select: { amount: true } },
        },
      },
    },
  });
  const booking = lead?.status === "CONVERTED" ? lead.booking : null;
  // Only a real price change syncs: re-saving an unchanged lead/itinerary must
  // not overwrite an amount corrected directly on the booking (Edit Details).
  const priceChanged = lead?.negotiatedAmount !== amount;
  if (!booking || booking.deletedAt || booking.servicesLocked || !priceChanged || booking.amount === amount) {
    return { op: null, error: null };
  }

  const finance = computeBookingFinance({ amount, payments: booking.payments, services: booking.services });
  const floor = Math.max(finance.paidAmount, finance.servicesTotal);
  if (amount < floor) {
    return {
      op: null,
      error: `The new price ${inr(amount)} is below what the booking already has paid / in services (${inr(floor)}).`,
    };
  }
  return { op: prisma.booking.update({ where: { id: booking.id }, data: { amount } }), error: null };
}
