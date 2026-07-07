// Marketing attribution — single shared definition used by Lead, Booking, and
// the Offline Conversion pipeline. Client-safe (no Prisma/next-server imports)
// so it can be imported from "use client" components as well as API routes.
//
// Postgres/Prisma has no cross-model embedded/composite type (that's a Mongo-
// only Prisma feature), so Lead and Booking each declare their own copy of
// these columns — but there is exactly ONE list of field names, ONE Zod
// schema, and ONE pick/build helper, defined here. Both models stay in sync
// through this file, not through duplicated logic at each call site.

import { z } from "zod";
import { isInternalRoute } from "@/lib/internalRoutes";

export const ATTRIBUTION_FIELDS = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
  "landingPage",
  "referrer",
] as const;

export type AttributionField = (typeof ATTRIBUTION_FIELDS)[number];
export type AttributionData = Partial<Record<AttributionField, string>>;

// Click IDs / UTM values are short tokens; landingPage/referrer are URLs.
// Caps guard against a forged oversized payload — this is client-controlled input.
const shortField = z.string().trim().max(255).optional();
const urlField = z.string().trim().max(1000).optional();

export const attributionSchema: z.ZodType<AttributionData> = z.object({
  utmSource: shortField,
  utmMedium: shortField,
  utmCampaign: shortField,
  utmTerm: shortField,
  utmContent: shortField,
  gclid: shortField,
  gbraid: shortField,
  wbraid: shortField,
  fbclid: shortField,
  msclkid: shortField,
  landingPage: urlField,
  referrer: urlField,
});

/** Picks only the attribution fields off any Lead/Booking-shaped record. */
export function pickAttribution(record: Partial<Record<AttributionField, string | null>>): AttributionData {
  const out: AttributionData = {};
  for (const field of ATTRIBUTION_FIELDS) {
    const value = record[field];
    if (value) out[field] = value;
  }
  return out;
}

// ── Client-side capture (first-touch, permanent) ────────────────────────────
// One JSON cookie, written once per browser and never overwritten — later
// visits/campaigns don't reset it. Read back by LeadForm/BookingForm at submit
// time and sent as part of the request body (never trust a client-forged
// cookie server-side beyond normal Zod validation — same as any form field).

const COOKIE_NAME = "vkh_attribution";
const COOKIE_MAX_AGE_DAYS = 90; // matches typical ad-platform click attribution windows

const CLICK_ID_PARAMS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid"] as const;

const UTM_PARAM_MAP: Record<string, AttributionField> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
};

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Call once on app load. No-ops on internal (/admin) routes and if already captured. */
export function captureAttributionClient(): void {
  if (typeof window === "undefined") return;
  if (isInternalRoute(window.location.pathname)) return;
  if (readCookie(COOKIE_NAME)) return; // first-touch already recorded

  const params = new URLSearchParams(window.location.search);
  const data: AttributionData = {};

  for (const key of CLICK_ID_PARAMS) {
    const value = params.get(key);
    if (value) data[key as AttributionField] = value;
  }
  for (const [param, field] of Object.entries(UTM_PARAM_MAP)) {
    const value = params.get(param);
    if (value) data[field] = value;
  }
  data.landingPage = window.location.href;
  if (document.referrer) data.referrer = document.referrer;

  if (Object.keys(data).length === 0) return;

  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Reads the first-touch attribution captured for this browser, if any. */
export function readAttributionClient(): AttributionData | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as AttributionData;
  } catch {
    return undefined;
  }
}
