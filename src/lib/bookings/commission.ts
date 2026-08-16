// Single source of truth for booking-profit and employee-commission math.
// Built on top of computeBookingFinance (src/lib/bookings/finance.ts) — never
// re-derive bookingAmount/discount/servicesTotal here, only extend it.
//
// Formula: Commissionable Profit = effectivePayable - servicesTotal - GST.
// GST is deducted using the actual recorded gstAmount on each payment (see
// src/lib/payments/gst.ts) — never a hardcoded rate — since it's already
// persisted, payment-method aware (GST-exempt for cash), and accurate.

import { round2, type BookingFinance } from "@/lib/bookings/finance";

export interface CommissionPaymentInput {
  amount: number;
  type?: string | null;
  gstAmount?: number | null;
}

/** Net GST recorded across a booking's payments (REFUND rows subtract back out). */
export function computeGstDeduction(payments: CommissionPaymentInput[]): number {
  return round2(
    payments.reduce((s, p) => {
      const gst = p.gstAmount ?? 0;
      return s + (p.type === "REFUND" ? -gst : gst);
    }, 0),
  );
}

export function computeBookingProfit(finance: BookingFinance, gstDeduction: number): number {
  return round2(Math.max(0, finance.effectivePayable - finance.servicesTotal - gstDeduction));
}

export function computeCommission(profitAmount: number, ratePct: number): number {
  return round2(Math.max(0, profitAmount) * (ratePct / 100));
}
