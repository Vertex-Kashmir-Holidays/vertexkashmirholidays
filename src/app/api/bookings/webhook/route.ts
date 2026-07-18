import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { recordOnlinePayment } from "@/lib/bookings/online-payment";
import { finalizeOnlinePayment } from "@/lib/bookings/notify";
import { logPaymentAudit } from "@/lib/bookings/audit";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  // Read raw body BEFORE any JSON parsing so HMAC is computed on the exact bytes.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET ?? "")
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature, "hex");
  const isValid =
    expectedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, receivedBuf);

  if (!isValid) {
    return new Response("Invalid signature", { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = JSON.parse(rawBody) as { event: string; payload: any };

  const paymentEntity = event.payload?.payment?.entity;
  const orderId: string | undefined = paymentEntity?.order_id;
  const paymentId: string | undefined = paymentEntity?.id;

  if (!orderId) return new Response("OK", { status: 200 });

  const booking = await prisma.booking.findUnique({
    where: { razorpayOrderId: orderId },
    select: { id: true, amount: true, paymentOption: true, status: true },
  });

  if (!booking) return new Response("OK", { status: 200 });

  if ((event.event === "payment.captured" || event.event === "order.paid") && paymentId) {
    // Record on the shared ledger if the verify route hasn't already (idempotent).
    // This guarantees the payment is captured even if the customer closed the tab.
    const method = typeof paymentEntity?.method === "string" ? paymentEntity.method : null;
    const metadata = JSON.stringify({
      method: paymentEntity?.method ?? null,
      bank: paymentEntity?.bank ?? null,
      wallet: paymentEntity?.wallet ?? null,
      vpa: paymentEntity?.vpa ?? null,
      status: paymentEntity?.status ?? null,
      source: "webhook",
    });

    const { newPaymentId, chargeable } = await recordOnlinePayment({
      booking,
      paymentId,
      orderId,
      signature: null, // webhook authenticity is the body HMAC, not an order signature
      method,
      metadata,
      auditEvent: "WEBHOOK_CAPTURED",
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "PAID", razorpayPayId: paymentId },
    });

    // Only when THIS path recorded the payment first (no double-run): link/create
    // the customer account + send credentials/confirmation/receipt emails.
    if (newPaymentId) {
      await finalizeOnlinePayment(booking.id, chargeable, paymentId, newPaymentId);
    }
  } else if (event.event === "payment.failed") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "FAILED" },
    });
    await logPaymentAudit({
      event: "WEBHOOK_FAILED",
      status: "failed",
      bookingId: booking.id,
      orderId,
      paymentId: paymentId ?? null,
      detail: "payment.failed",
    });
  }

  return new Response("OK", { status: 200 });
}
