"use client";

import { createContext, useCallback, useContext } from "react";
import { buildWhatsAppHref } from "@/lib/whatsapp";

export interface SiteSettingsValue {
  siteName: string;
  whatsapp: string | null;
  sitePhone: string | null;
  showAnnouncementBanner: boolean;
  announcementMessage: string | null;
}

const DEFAULTS: SiteSettingsValue = {
  siteName: "Vertex Kashmir Holidays",
  whatsapp: null,
  sitePhone: null,
  showAnnouncementBanner: false,
  announcementMessage: null,
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
 * site's configured number (whatsapp → phone fallback).
 */
export function useWhatsAppLink(): (message?: string) => string {
  const { whatsapp, sitePhone } = useContext(Ctx);
  const number = whatsapp || sitePhone || "";
  return useCallback((message?: string) => buildWhatsAppHref(number, message), [number]);
}
