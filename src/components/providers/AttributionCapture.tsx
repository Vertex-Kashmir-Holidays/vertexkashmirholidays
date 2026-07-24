"use client";

import { useEffect } from "react";
import { captureAttributionClient } from "@/lib/attribution";
import { getCookieConsent, onCookieConsentChange } from "@/lib/cookieConsent";

/**
 * Fires once per browser on first load — see captureAttributionClient().
 * Gated on the same analytics consent as GTM: the attribution cookie is
 * marketing data (ad campaign/referrer tracking), not something the site
 * needs to function, so it only gets written once a visitor has said yes.
 */
export function AttributionCapture() {
  useEffect(() => {
    if (getCookieConsent()?.analytics) captureAttributionClient();

    return onCookieConsentChange((consent) => {
      if (consent.analytics) captureAttributionClient();
    });
  }, []);

  return null;
}
