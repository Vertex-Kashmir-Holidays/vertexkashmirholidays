// GST handling for booking payments. GST applies ONLY to non-cash payments and is
// always optional. Both the selected percent and the computed value are persisted
// on each payment so future booking-wise / payment-wise GST reports need no
// recomputation. Server-authoritative: routes recompute the value here rather than
// trusting any client-sent amount.

import { round2 } from "@/lib/bookings/finance";

/** Fallback GST options when SiteSettings has none. */
export const DEFAULT_GST_RATES = [5, 16, 18];

/** Selectable payment methods. Anything other than "Cash" is GST-eligible. */
export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Online"] as const;

/** Parse the configurable GST rates stored as a JSON number array on SiteSettings. */
export function parseGstRates(raw: string | null | undefined): number[] {
  if (!raw) return DEFAULT_GST_RATES;
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) {
      const nums = v.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
      if (nums.length) return nums;
    }
  } catch {
    /* fall through to default */
  }
  return DEFAULT_GST_RATES;
}

/** Cash is identified case-insensitively; cash payments never carry GST. */
export function isCashMethod(method?: string | null): boolean {
  return (method ?? "").trim().toLowerCase() === "cash";
}

/**
 * Resolve the GST to persist for a payment. Returns nulls for cash payments or
 * when no positive percent was chosen; otherwise the percent + the computed value.
 */
export function resolveGst(
  amount: number,
  percent: number | null | undefined,
  method?: string | null,
): { gstPercent: number | null; gstAmount: number | null } {
  if (percent == null || !(percent > 0)) return { gstPercent: null, gstAmount: null };
  if (isCashMethod(method)) return { gstPercent: null, gstAmount: null };
  return { gstPercent: percent, gstAmount: round2((amount * percent) / 100) };
}
