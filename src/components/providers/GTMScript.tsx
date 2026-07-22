"use client";

import { useEffect, useState } from "react";
import { getCookieConsent, onCookieConsentChange } from "@/lib/cookieConsent";

interface GTMScriptProps {
  gtmId: string;
  nonce?: string;
}

export function GTMScript({ gtmId, nonce }: GTMScriptProps) {
  // Starts false so nothing loads until an explicit choice is on file; flips
  // to true immediately if the visitor accepts analytics mid-session (no
  // refresh needed), via the same consent-change event CookieConsentManager
  // dispatches on save.
  const [analyticsAllowed, setAnalyticsAllowed] = useState(
    () => getCookieConsent()?.analytics ?? false,
  );

  useEffect(() => onCookieConsentChange((consent) => setAnalyticsAllowed(consent.analytics)), []);

  useEffect(() => {
    if (!analyticsAllowed) return;
    if (document.getElementById("gtm-init")) return;

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

    const script = document.createElement("script");
    script.id = "gtm-init";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    if (nonce) script.setAttribute("nonce", nonce);

    document.head.insertBefore(script, document.head.firstChild);
  }, [analyticsAllowed, gtmId, nonce]);

  return null;
}
