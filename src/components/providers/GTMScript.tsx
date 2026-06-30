"use client";

import { useEffect } from "react";

interface GTMScriptProps {
  gtmId: string;
  nonce?: string;
}

export function GTMScript({ gtmId, nonce }: GTMScriptProps) {
  useEffect(() => {
    if (document.getElementById("gtm-init")) return;

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

    const script = document.createElement("script");
    script.id = "gtm-init";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    if (nonce) script.setAttribute("nonce", nonce);

    document.head.insertBefore(script, document.head.firstChild);
  }, [gtmId, nonce]);

  return null;
}
