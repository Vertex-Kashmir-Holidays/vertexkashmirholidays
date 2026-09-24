// Shared encoding for a Banner CTA that should open WhatsApp with a proper
// pre-filled message (phone number + attribution ref tag, exactly like every
// other WhatsApp CTA on the site) instead of a plain link. No schema change:
// the existing Banner.ctaUrl string column just stores "whatsapp:<message>"
// when the admin picks "WhatsApp" as the CTA type in BannerForm — the public
// renderer (PromoBannerCard / BannerStripView) recognizes the prefix and
// builds the real wa.me href at render time via useWhatsAppLink(), so the
// phone number and attribution tag are never hardcoded/stale in the DB.
const WHATSAPP_CTA_PREFIX = "whatsapp:";

export function isWhatsAppCtaUrl(url: string | null | undefined): url is string {
  return !!url && url.startsWith(WHATSAPP_CTA_PREFIX);
}

export function getWhatsAppCtaMessage(url: string): string {
  return url.slice(WHATSAPP_CTA_PREFIX.length);
}

export function buildWhatsAppCtaUrl(message: string): string {
  return `${WHATSAPP_CTA_PREFIX}${message}`;
}
