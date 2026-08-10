"use client";

import { useEffect } from "react";
import { bufferAttributionRaw, captureAttributionClient } from "@/lib/attribution";
import { getCookieConsent, onCookieConsentChange } from "@/lib/cookieConsent";

/**
 * Fires once per browser on first load.
 *
 * Two capture paths, deliberately kept separate:
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
 */
export function AttributionCapture() {
  useEffect(() => {
    bufferAttributionRaw();

    if (getCookieConsent()?.analytics) captureAttributionClient();

    return onCookieConsentChange((consent) => {
      if (consent.analytics) captureAttributionClient();
    });
  }, []);

  return null;
}
