// Payments we make to a hotel for one stay (HotelPayment rows on a HOTEL
// BookingService). Pure helpers — safe in client components.
//
// The stay's `amount` (set in booking services) is the total owed to the
// hotel; payments are usually a token to confirm, then the balance before
// checkout. Friendly hotels may confirm without a token (hotelTokenWaived).

import { round2 } from "@/lib/bookings/finance";

export type HotelPaymentTypeValue = "TOKEN" | "BALANCE";

export const HOTEL_PAYMENT_TYPE_LABEL: Record<HotelPaymentTypeValue, string> = {
  TOKEN: "Token amount",
  BALANCE: "Balance payment",
};

/** A payment row as sent to the client. */
export interface HotelPaymentRow {
  id: string;
  amount: number;
  type: HotelPaymentTypeValue;
  method: string;
  paidBy: string;
  receiptUrl: string | null;
  emailedTo: string | null;
  createdAt: string;
}

export interface HotelPaymentSummary {
  total: number;
  paid: number;
  balance: number;
}

export function hotelPaymentSummary(total: number, payments: { amount: number }[]): HotelPaymentSummary {
  const paid = round2(payments.reduce((s, p) => s + p.amount, 0));
  return { total: round2(total), paid, balance: round2(total - paid) };
}

/** "6 adults, 2 kids" — falls back to the booking's traveller count. */
export function guestsLabel(adults: number | null | undefined, children: number | null | undefined, travellers: number): string {
  if (adults == null) return `${travellers} ${travellers === 1 ? "guest" : "guests"}`;
  const parts = [`${adults} ${adults === 1 ? "adult" : "adults"}`];
  if (children) parts.push(`${children} ${children === 1 ? "kid" : "kids"}`);
  return parts.join(", ");
}

/** Which type a new payment most likely is: token first, balance after. */
export function nextHotelPaymentType(payments: { type: string }[], tokenWaived: boolean): HotelPaymentTypeValue {
  return tokenWaived || payments.some((p) => p.type === "TOKEN") ? "BALANCE" : "TOKEN";
}
