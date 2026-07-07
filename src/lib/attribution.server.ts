// Server-only attribution helpers (Prisma enum + request headers). Never
// import this from a "use client" component — see src/lib/attribution.ts for
// the client-safe half of this module.

import { LeadSource } from "@prisma/client";
import { clientIp } from "@/lib/ratelimit";
import { ATTRIBUTION_FIELDS, type AttributionData } from "@/lib/attribution";

/**
 * Derives the marketing channel from real attribution signals — replaces the
 * old resolveSource(), which guessed the channel from the on-site placement
 * tag (sourcePage) rather than an actual ad-click identifier. Checked in order
 * of specificity: a platform click ID is the strongest signal, UTM values are
 * the fallback, and REFERRAL/WEBSITE are last.
 */
export function deriveChannel(attribution: AttributionData | undefined): LeadSource {
  const a = attribution ?? {};

  if (a.gclid || a.gbraid || a.wbraid) return LeadSource.GOOGLE_ADS;
  if (a.fbclid) return LeadSource.META_ADS;
  // No dedicated Microsoft/Bing enum value exists today — bucketed under
  // THIRD_PARTY, the closest existing catch-all for a paid, non-Google/Meta
  // click. Add a MICROSOFT_ADS value if/when it needs its own reporting bucket.
  if (a.msclkid) return LeadSource.THIRD_PARTY;

  const source = a.utmSource?.toLowerCase();
  const medium = a.utmMedium?.toLowerCase();
  if (source === "google" && (medium === "cpc" || medium === "ppc")) return LeadSource.GOOGLE_ADS;
  if ((source === "facebook" || source === "instagram" || source === "meta") && medium === "cpc") {
    return LeadSource.META_ADS;
  }
  if (medium === "referral") return LeadSource.REFERRAL;
  if (source) return LeadSource.THIRD_PARTY;

  return LeadSource.WEBSITE;
}

/**
 * Merges client-supplied attribution with server-derived ipAddress/userAgent
 * into one object ready to spread into a Lead or Booking `create()` call.
 * ipAddress/userAgent are always derived server-side — never taken from the
 * client payload, which could be spoofed.
 */
export function buildAttributionCreateInput(
  attribution: AttributionData | undefined,
  req: Request,
): AttributionData & { ipAddress?: string; userAgent?: string } {
  const picked: AttributionData = {};
  for (const field of ATTRIBUTION_FIELDS) {
    const value = attribution?.[field];
    if (value) picked[field] = value;
  }
  return {
    ...picked,
    ipAddress: clientIp(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  };
}
