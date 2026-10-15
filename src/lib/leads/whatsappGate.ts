// Routes WhatsApp opens through the qualification modal
// (components/leads/WhatsAppQualificationGate.tsx). Links are caught by the
// gate's own click listener; code that opens WhatsApp without a link (e.g. a
// toast action) calls requestWhatsAppOpen() instead of window.open().

let handler: ((href: string) => void) | null = null;

export function setWhatsAppGateHandler(next: ((href: string) => void) | null): void {
  handler = next;
}

export function isWhatsAppHref(href: string): boolean {
  try {
    const { hostname } = new URL(href);
    return hostname === "wa.me" || hostname === "api.whatsapp.com";
  } catch {
    return false;
  }
}

/** Opens WhatsApp via the qualification modal (falls back to a plain open
 *  where the gate isn't mounted, e.g. outside the public site). */
export function requestWhatsAppOpen(href: string): void {
  if (handler) handler(href);
  else window.open(href, "_blank", "noopener,noreferrer");
}
