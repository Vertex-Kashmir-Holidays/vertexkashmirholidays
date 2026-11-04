"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js so Chrome offers the "Install app" prompt (see the comment
 * at the top of public/sw.js). Production only — in development the MSW mock
 * worker (public/mockServiceWorker.js) may own the scope, and a second worker
 * there just causes confusion. Registration waits for window load so it never
 * competes with the page's own critical requests.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-critical: the site works the same without it, it just can't be
        // installed via the automatic prompt.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
