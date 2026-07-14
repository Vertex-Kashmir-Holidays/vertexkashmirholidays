import type { ItineraryData } from "@/types/itinerary";

// Bundled fallback QR — used whenever an itinerary has no admin-set
// paymentQrUrl. This is the ONLY place that path is allowed to appear;
// callers must go through getPaymentQr() rather than hardcoding it.
export const DEFAULT_PAYMENT_QR_SRC = "/gateway/QrCode.jpeg";

/** Which QR image an itinerary's PDF should embed: custom if set, else the default. */
export function getPaymentQr(data: Pick<ItineraryData, "paymentQrUrl">): string {
  return data.paymentQrUrl?.trim() || DEFAULT_PAYMENT_QR_SRC;
}
