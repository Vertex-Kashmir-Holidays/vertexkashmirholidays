"use client";

import { useSyncExternalStore } from "react";
import { readWhatsAppAttributionTag, subscribeWhatsAppAttributionTag } from "@/lib/attribution";

const SERVER_SNAPSHOT = () => undefined;

/**
 * Reactive version of readWhatsAppAttributionTag() (src/lib/attribution.ts)
 * — re-renders the calling component when the cached WhatsApp attribution
 * tag changes (i.e. right after ensureWhatsAppAttributionToken()'s fetch
 * resolves and writes the vkh_wa_token cookie). Call this in any
 * component/hook that renders a WhatsApp href so the href gets recomputed
 * once the token becomes available, instead of being permanently stuck with
 * whatever it read on the first render (before the token existed) — see
 * useWhatsAppLink() in SiteSettingsProvider.tsx, ContactWhatsAppFloat.tsx,
 * and Footer.tsx for the call sites.
 *
 * Kept in its own "use client" file, separate from attribution.ts: that
 * module is also imported by plain server code (e.g.
 * src/app/api/bookings/create-order/route.ts), and Next.js's build fails if
 * any React hook is reachable from a Route Handler's module graph.
 */
export function useWhatsAppAttributionTag(): string | undefined {
  return useSyncExternalStore(subscribeWhatsAppAttributionTag, readWhatsAppAttributionTag, SERVER_SNAPSHOT);
}
