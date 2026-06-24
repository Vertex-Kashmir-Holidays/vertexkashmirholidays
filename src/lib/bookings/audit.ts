// Append-only payment audit trail. Best-effort: a failed audit write must never
// break a payment flow, so every call is wrapped and swallows its own errors.
// Never log raw secrets (signatures, keys) — only ids, amounts, and short detail.

import { prisma } from "@/lib/prisma";

export type PaymentAuditEvent =
  | "ORDER_CREATED"
  | "PAYMENT_VERIFIED"
  | "VERIFICATION_FAILED"
  | "WEBHOOK_CAPTURED"
  | "WEBHOOK_FAILED"
  | "RECONCILED"
  | "CREDENTIALS_RESENT"
  | "EMAILS_RESENT";

export interface PaymentAuditInput {
  event: PaymentAuditEvent;
  bookingId?: string | null;
  status?: "success" | "failed" | null;
  orderId?: string | null;
  paymentId?: string | null;
  amount?: number | null;
  ip?: string | null;
  detail?: string | null;
}

export async function logPaymentAudit(input: PaymentAuditInput): Promise<void> {
  try {
    await prisma.paymentAudit.create({
      data: {
        event: input.event,
        bookingId: input.bookingId ?? null,
        status: input.status ?? null,
        orderId: input.orderId ?? null,
        paymentId: input.paymentId ?? null,
        amount: input.amount ?? null,
        ip: input.ip ?? null,
        detail: input.detail ?? null,
      },
    });
  } catch (err) {
    // Audit logging is non-critical — never let it break the payment flow.
    console.error("[payment-audit] write failed:", input.event, err);
  }
}
