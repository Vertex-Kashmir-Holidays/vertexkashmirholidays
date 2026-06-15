/**
 * Build a WhatsApp click-to-chat URL from a phone number + optional prefilled
 * message. Strips everything but digits (wa.me needs the full intl number with
 * no +/spaces). Falls back to the contact page when no number is configured.
 */
export function buildWhatsAppHref(number?: string | null, message?: string): string {
  const digits = (number ?? "").replace(/[^0-9]/g, "");
  if (!digits) return "/contact";
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
