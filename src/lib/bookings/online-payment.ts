// Shared recorder for online (Razorpay) payments. Used by BOTH the client-side
// verify-payment route and the server-to-server webhook, so the payment ledger
// stays correct no matter which path confirms first (idempotent on the gateway
// payment id). The chargeable amount is always recomputed server-side from the
// booking total + chosen option — never trusted from the client.

import { prisma } from "@/lib/prisma";
import { computeChargeable, isPaymentOption, type PaymentOption } from "@/lib/bookings/finance";
import { logPaymentAudit, type PaymentAuditEvent } from "@/lib/bookings/audit";

export interface RecordOnlinePaymentResult {
  newPaymentId: string | null; // null when this payment was already recorded
  chargeable: number;
  option: PaymentOption;
}

export async function recordOnlinePayment(opts: {
  booking: { id: string; amount: number; paymentOption: string | null };
  paymentId: string;
  orderId: string;
  signature?: string | null;
  method?: string | null;
  metadata?: string | null;
  ip?: string | null;
  auditEvent: Extract<PaymentAuditEvent, "PAYMENT_VERIFIED" | "WEBHOOK_CAPTURED" | "RECONCILED">;
}): Promise<RecordOnlinePaymentResult> {
  const option: PaymentOption = isPaymentOption(opts.booking.paymentOption)
    ? opts.booking.paymentOption
    : "FULL";
  const chargeable = computeChargeable(opts.booking.amount, option);

  // Idempotency: one ledger row per gateway payment id.
  const existing = await prisma.bookingPayment.findFirst({
    where: { bookingId: opts.booking.id, reference: opts.paymentId },
    select: { id: true },
  });
  if (existing) return { newPaymentId: null, chargeable, option };

  const payment = await prisma.bookingPayment.create({
    data: {
      bookingId: opts.booking.id,
      amount: chargeable,
      // Advance → TOKEN (partial); full payment → FINAL.
      type: option === "ADVANCE" ? "TOKEN" : "FINAL",
      method: opts.method ?? "razorpay",
      reference: opts.paymentId,
      gatewayOrderId: opts.orderId,
      gatewaySignature: opts.signature ?? null,
      metadata: opts.metadata ?? null,
      note: option === "ADVANCE" ? "Online advance payment (10%)" : "Online full payment",
    },
    select: { id: true },
  });

  await logPaymentAudit({
    event: opts.auditEvent,
    status: "success",
    bookingId: opts.booking.id,
    orderId: opts.orderId,
    paymentId: opts.paymentId,
    amount: chargeable,
    ip: opts.ip ?? null,
    detail: `option=${option}`,
  });

  return { newPaymentId: payment.id, chargeable, option };
}
