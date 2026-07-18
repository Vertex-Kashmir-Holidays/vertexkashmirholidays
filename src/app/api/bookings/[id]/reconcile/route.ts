import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { recordOnlinePayment } from "@/lib/bookings/online-payment";
import { finalizeOnlinePayment } from "@/lib/bookings/notify";
import { logPaymentAudit } from "@/lib/bookings/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Manual payment verification (admin). Re-queries Razorpay for the booking's
 * order and, if a captured payment exists that isn't yet in the ledger, records
 * it (idempotent via the shared recorder) and finalises the booking — linking the
 * customer + sending emails. Recovers bookings where the client never returned
 * and the webhook was missed.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, amount: true, paymentOption: true, razorpayOrderId: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!booking.razorpayOrderId) {
    return NextResponse.json(
      { error: "This booking has no Razorpay order to verify." },
      { status: 422 },
    );
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
  }

  let captured: { id: string; method?: string } | null = null;
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const res = (await razorpay.orders.fetchPayments(booking.razorpayOrderId)) as unknown as {
      items?: Array<Record<string, unknown>>;
    };
    const item = (res.items ?? []).find((p) => p.status === "captured");
    if (item) captured = { id: String(item.id), method: typeof item.method === "string" ? item.method : undefined };
  } catch (err) {
    console.error("[reconcile] razorpay fetch failed", err);
    return NextResponse.json({ error: "Could not reach the payment gateway." }, { status: 502 });
  }

  if (!captured) {
    await logPaymentAudit({
      event: "RECONCILED",
      status: "failed",
      bookingId: booking.id,
      orderId: booking.razorpayOrderId,
      detail: "no captured payment found",
    });
    return NextResponse.json({ reconciled: false, message: "No captured payment found for this order." });
  }

  // Record the ledger row AND mark the booking paid in a single transaction.
  const { newPaymentId, chargeable } = await recordOnlinePayment({
    booking,
    bookingStatus: "PAID",
    paymentId: captured.id,
    orderId: booking.razorpayOrderId,
    method: captured.method ?? "razorpay",
    metadata: JSON.stringify({ source: "manual-reconcile", method: captured.method ?? null }),
    auditEvent: "RECONCILED",
  });

  if (newPaymentId) {
    await finalizeOnlinePayment(booking.id, chargeable, captured.id, newPaymentId);
    return NextResponse.json({ reconciled: true, recorded: true });
  }
  // Already in the ledger — nothing new, but the booking is confirmed paid.
  return NextResponse.json({ reconciled: true, recorded: false, message: "Payment already recorded." });
}
