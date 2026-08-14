"use client";

import { useEffect } from "react";
import {
  bufferAttributionRaw,
  captureAttributionClient,
  ensureWhatsAppAttributionToken,
} from "@/lib/attribution";
import { getCookieConsent, onCookieConsentChange } from "@/lib/cookieConsent";

/**
 * Fires once per browser on first load.
 *
 * Three capture paths:
 *  - bufferAttributionRaw() runs unconditionally, no consent required. It
 *    only ever writes an ephemeral, short-TTL, first-party localStorage
 *    buffer — never the real attribution cookie, never anything transmitted
 *    anywhere. See the detailed comment in src/lib/attribution.ts for why
 *    this exists and its documented risk/policy tradeoff.
 *  - captureAttributionClient() is unchanged: gated on the same analytics
 *    consent as GTM, and is the only thing that ever writes the real 90-day
 *    vkh_attribution cookie that feeds the CRM/offline-conversion pipeline.
 *    It now additionally consults the buffer above (in case the visitor
 *    landed on an earlier, different page than the one they consented on),
 *    then clears it.
 *  - ensureWhatsAppAttributionToken() also runs unconditionally (business
 *    decision, 2026-08-14 — see its doc comment in src/lib/attribution.ts for
 *    the reasoning) so a WhatsApp reference tag is ready the moment the
 *    visitor clicks a WhatsApp CTA (src/lib/whatsapp.ts), without waiting on
 *    this site's own cookie-consent banner. It no-ops on its own when
 *    there's nothing meaningful to bridge or a token already exists for the
 *    current attribution — see src/lib/attribution.ts for the dedupe logic.
 *    Called again on a later consent change too, in case that's the moment
 *    the buffer got promoted into the real cookie — harmless no-op if the
 *    underlying attribution didn't actually change.
 */
export function AttributionCapture() {
  useEffect(() => {
    bufferAttributionRaw();
    ensureWhatsAppAttributionToken();

    if (getCookieConsent()?.analytics) captureAttributionClient();

    return onCookieConsentChange((consent) => {
      if (consent.analytics) captureAttributionClient();
      ensureWhatsAppAttributionToken();
    });
  }, []);

  return null;
}
