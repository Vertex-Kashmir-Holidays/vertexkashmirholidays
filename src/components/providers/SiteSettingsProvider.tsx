"use client";

import { createContext, useCallback, useContext } from "react";
import { buildWhatsAppHref, appendWhatsAppAttributionTag } from "@/lib/whatsapp";
import { useWhatsAppAttributionTag } from "@/lib/useWhatsAppAttributionTag";

export interface SiteSettingsValue {
  siteName: string;
  whatsapp: string | null;
  sitePhone: string | null;
  showAnnouncementBanner: boolean;
  announcementMessage: string | null;
  /** Real customer photos used as social-proof avatars next to lead forms sitewide. */
  formAvatars: string[];
}

const DEFAULTS: SiteSettingsValue = {
  siteName: "Vertex Kashmir Holidays",
  whatsapp: null,
  sitePhone: null,
  showAnnouncementBanner: false,
  announcementMessage: null,
  formAvatars: [],
};

const Ctx = createContext<SiteSettingsValue>(DEFAULTS);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: SiteSettingsValue;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteSettings(): SiteSettingsValue {
  return useContext(Ctx);
}

/**
 * Returns a builder that turns a message into a WhatsApp link using the
 * site's configured number (whatsapp → phone fallback). When a WhatsApp
 * attribution reference has been minted for this browser (see
 * src/lib/attribution.ts), it's appended to the message automatically —
 * callers don't need to know about it.
 *
 * The token is usually still being minted (an async fetch) when a component
 * first calls this — useWhatsAppAttributionTag() correctly returns undefined
 * during SSR/hydration (matching what the server rendered) and re-renders
 * the caller with the real tag once it's ready, so the builder below then
 * produces an updated href.
 */
export function useWhatsAppLink(): (message?: string) => string {
  const { whatsapp, sitePhone } = useContext(Ctx);
  const number = whatsapp || sitePhone || "";
  const tag = useWhatsAppAttributionTag();
  return useCallback(
    (message?: string) => appendWhatsAppAttributionTag(buildWhatsAppHref(number, message), tag),
    [number, tag],
  );
}
