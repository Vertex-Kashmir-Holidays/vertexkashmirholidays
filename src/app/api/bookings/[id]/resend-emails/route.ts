import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import {
  sendBookingConfirmationEmail,
  sendPaymentInvoiceEmail,
  sendBookingSummaryEmail,
} from "@/lib/bookings/notify";
import { logPaymentAudit } from "@/lib/bookings/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Resend booking emails (admin). Re-sends the booking summary, and — when a
 * payment exists — the confirmation + the latest payment receipt. Reuses the
 * shared notify helpers (same content the customer originally received).
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      guestEmail: true,
      user: { select: { email: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, amount: true, reference: true },
      },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const to = booking.guestEmail ?? booking.user?.email ?? null;
  if (!to) {
    return NextResponse.json({ error: "No email on file for this booking." }, { status: 422 });
  }

  // Booking summary (always). Confirmation + receipt only when a payment exists.
  await sendBookingSummaryEmail(booking.id);
  const last = booking.payments[0];
  if (last) {
    await sendBookingConfirmationEmail(booking.id, last.amount, last.reference ?? booking.id);
    await sendPaymentInvoiceEmail(booking.id, last.id);
  }

  await logPaymentAudit({
    event: "EMAILS_RESENT",
    status: "success",
    bookingId: id,
    detail: last ? "summary+confirmation+receipt" : "summary",
  });

  return NextResponse.json({ success: true });
}
