// Shared recorder for online (Razorpay) payments. Used by BOTH the client-side
// verify-payment route and the server-to-server webhook, so the payment ledger
// stays correct no matter which path confirms first (idempotent on the gateway
// payment id). The chargeable amount is always recomputed server-side from the
// booking total + chosen option — never trusted from the client.

import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeChargeable, isPaymentOption, type PaymentOption } from "@/lib/bookings/finance";
import { logPaymentAudit, type PaymentAuditEvent } from "@/lib/bookings/audit";

export interface RecordOnlinePaymentResult {
  newPaymentId: string | null; // null when this payment was already recorded
  chargeable: number;
  option: PaymentOption;
  status: BookingStatus; // booking lifecycle status applied by this call
}

export async function recordOnlinePayment(opts: {
  booking: { id: string; amount: number; paymentOption: string | null };
  // Lifecycle status to set on the booking as part of the same atomic write
  // (e.g. "CONFIRMED" on client verify, "PAID" on webhook/reconcile).
  bookingStatus: BookingStatus;
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

  // Atomic: the ledger row and the booking-status update commit together, so a
  // mid-request crash can never leave a booking marked paid with no matching
  // payment row (VERTE-16). The booking status is always applied; the ledger row
  // is created only once per gateway payment id (idempotent for a racing
  // webhook/verify or a retry).
  const newPaymentId = await prisma.$transaction(async (tx) => {
    const existing = await tx.bookingPayment.findFirst({
      where: { bookingId: opts.booking.id, reference: opts.paymentId },
      select: { id: true },
    });

    let createdId: string | null = null;
    if (!existing) {
      const payment = await tx.bookingPayment.create({
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
      createdId = payment.id;
    }

    await tx.booking.update({
      where: { id: opts.booking.id },
      data: { status: opts.bookingStatus, razorpayPayId: opts.paymentId },
    });

    return createdId;
  });

  // Audit is best-effort and intentionally OUTSIDE the transaction: it swallows
  // its own errors, and a swallowed failure inside the tx would abort the commit
  // and roll back the real payment. Logged only when this call recorded a new
  // row (a no-op idempotent replay is not re-audited), matching prior behaviour.
  if (newPaymentId) {
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
  }

  return { newPaymentId, chargeable, option, status: opts.bookingStatus };
}
