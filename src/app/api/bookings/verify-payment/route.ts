import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { logPaymentAudit } from "@/lib/bookings/audit";
import { recordOnlinePayment } from "@/lib/bookings/online-payment";
import { finalizeOnlinePayment } from "@/lib/bookings/notify";
import Razorpay from "razorpay";
import { env } from "@/lib/env";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Best-effort fetch of the gateway payment for richer metadata (method, bank…).
// Never throws — the signature has already proven authenticity.
async function fetchGatewayMeta(paymentId: string): Promise<{ method: string | null; metadata: string | null }> {
  try {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_SECRET) {
      return { method: null, metadata: null };
    }
    const razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_SECRET,
    });
    const p = (await razorpay.payments.fetch(paymentId)) as unknown as Record<string, unknown>;
    const method = typeof p.method === "string" ? p.method : null;
    const metadata = JSON.stringify({
      method: p.method ?? null,
      bank: p.bank ?? null,
      wallet: p.wallet ?? null,
      vpa: p.vpa ?? null,
      card_id: p.card_id ?? null,
      status: p.status ?? null,
    });
    return { method, metadata };
  } catch {
    return { method: null, metadata: null };
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  // Throttle verification attempts (slows brute-forcing of signatures).
  const limit = await rateLimit(`booking:verify:${ip}`, 20, "10 m");
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { razorpayOrderId: razorpay_order_id },
    include: { tour: { select: { title: true } } },
  });

  if (!booking) {
    await logPaymentAudit({
      event: "VERIFICATION_FAILED",
      status: "failed",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      ip,
      detail: "booking not found",
    });
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Ownership: a signed-in user may only verify their own booking. Guest bookings
  // (no userId) are allowed — the signature itself proves the payer.
  const session = await auth();
  if (booking.userId && session?.user?.id && booking.userId !== session.user.id) {
    await logPaymentAudit({
      event: "VERIFICATION_FAILED",
      status: "failed",
      bookingId: booking.id,
      orderId: razorpay_order_id,
      ip,
      detail: "ownership mismatch",
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // HMAC-SHA256 of "order_id|payment_id", compared in constant time (replay-safe).
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_SECRET ?? "")
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(razorpay_signature, "hex");
  const isValid =
    expectedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, receivedBuf);

  if (!isValid) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "FAILED" } });
    await logPaymentAudit({
      event: "VERIFICATION_FAILED",
      status: "failed",
      bookingId: booking.id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      ip,
      detail: "signature mismatch",
    });
    return NextResponse.json({ success: false, status: "FAILED" }, { status: 400 });
  }

  // Booking lifecycle reaches Confirmed once payment is verified. Payment state
  // (Pending/Partial/Full) is derived separately from the ledger.
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", razorpayPayId: razorpay_payment_id },
  });

  // Record the payment on the shared ledger (idempotent; recomputes the charged
  // amount server-side). Enrich with the gateway's method/metadata first.
  const { method, metadata } = await fetchGatewayMeta(razorpay_payment_id);
  const { newPaymentId, chargeable } = await recordOnlinePayment({
    booking,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    signature: razorpay_signature,
    method,
    metadata,
    ip,
    auditEvent: "PAYMENT_VERIFIED",
  });

  // First-record only (a retry or racing webhook is a no-op): link/create the
  // customer account + send credentials/confirmation/receipt emails.
  if (newPaymentId) {
    await finalizeOnlinePayment(booking.id, chargeable, razorpay_payment_id, newPaymentId);
  }

  return NextResponse.json({ success: true, status: updated.status });
}
