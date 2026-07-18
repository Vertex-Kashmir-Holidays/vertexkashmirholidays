// Single source of truth for booking financials. Pure + server-safe, so the API
// routes and the booking-services UI compute identical numbers (no drift).
//
// Rules:
//   discountAmount   = FLAT value, or PERCENT of bookingAmount (clamped 0..amount)
//   effectivePayable = bookingAmount - discountAmount
//   paidAmount       = sum of all payment rows
//   servicesTotal    = sum of all service rows
//   balance          = effectivePayable - paidAmount

export type DiscountType = "FLAT" | "PERCENT";

// Payment status is a derived financial state — kept separate from the booking
// lifecycle status (Pending → Confirmed → …). It is never stored; always computed
// from the effective payable vs the amount paid so it can never drift.
export type PaymentStatus = "PENDING" | "PARTIAL" | "FULL";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  FULL: "Full",
};

export function computePaymentStatus(effectivePayable: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return "PENDING";
  if (paidAmount >= effectivePayable) return "FULL";
  return "PARTIAL";
}

export interface BookingFinanceInput {
  amount: number; // raw booking amount
  discountType?: string | null; // "FLAT" | "PERCENT" | null
  discountValue?: number | null;
  payments: { amount: number }[];
  services: { amount: number }[];
}

export interface BookingFinance {
  bookingAmount: number;
  discountAmount: number;
  effectivePayable: number;
  paidAmount: number;
  servicesTotal: number;
  balance: number;
  paymentStatus: PaymentStatus;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ── Online payment options (advance vs full) ─────────────────────────────────
// The customer may pay a 10% advance or the full amount online. The chargeable
// amount is ALWAYS computed server-side from the booking total — never trusted
// from the client. Both create-order and verify-payment use this one function so
// the order amount and the recorded payment can never drift.

export type PaymentOption = "ADVANCE" | "FULL";
export const ADVANCE_PERCENT = 10;

export function isPaymentOption(v: unknown): v is PaymentOption {
  return v === "ADVANCE" || v === "FULL";
}

/** The amount to charge online for the chosen option, given the booking total. */
export function computeChargeable(total: number, option: PaymentOption): number {
  const t = round2(Math.max(0, total));
  return option === "ADVANCE" ? round2(t * (ADVANCE_PERCENT / 100)) : t;
}

export function computeDiscountAmount(
  amount: number,
  type?: string | null,
  value?: number | null,
): number {
  const v = value ?? 0;
  if (v <= 0) return 0;
  let d = 0;
  if (type === "PERCENT") d = amount * (v / 100);
  else if (type === "FLAT") d = v;
  return round2(Math.max(0, Math.min(d, amount)));
}

export function computeBookingFinance(input: BookingFinanceInput): BookingFinance {
  const bookingAmount = round2(Math.max(0, input.amount));
  const discountAmount = computeDiscountAmount(
    bookingAmount,
    input.discountType,
    input.discountValue,
  );
  const effectivePayable = round2(bookingAmount - discountAmount);
  const paidAmount = round2(input.payments.reduce((s, p) => s + (p.amount || 0), 0));
  const servicesTotal = round2(input.services.reduce((s, p) => s + (p.amount || 0), 0));
  const balance = round2(effectivePayable - paidAmount);
  const paymentStatus = computePaymentStatus(effectivePayable, paidAmount);
  return {
    bookingAmount,
    discountAmount,
    effectivePayable,
    paidAmount,
    servicesTotal,
    balance,
    paymentStatus,
  };
}
