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
export function pickAttribution(
  record: Partial<Record<AttributionField, string | null>>,
): AttributionData {
  const out: AttributionData = {};
  for (const field of ATTRIBUTION_FIELDS) {
    const value = record[field];
    if (value) out[field] = value;
  }
  return out;
}

// ── Client-side capture (first-touch, with click-id upgrade) ────────────────
// One JSON cookie. landingPage/referrer/UTMs are first-touch and never
// overwritten. Click-id fields (gclid/fbclid/etc.) that are still empty may
// be filled in by a later visit — without this, a returning visitor who
// clicks a fresh Google/Meta ad after already having an attribution cookie
// would never get that click id captured, silently breaking offline
// conversion sync. Read back by LeadForm/BookingForm at submit time and sent
// as part of the request body (never trust a client-forged cookie
// server-side beyond normal Zod validation — same as any form field).

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

function parseAttributionCookie(raw: string | null): AttributionData {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AttributionData;
  } catch {
    return {};
  }
}

/** Extracts click-ids/UTMs from a `location.search` string. Pure parsing, no storage. */
function parseAttributionFromUrl(search: string): AttributionData {
  const params = new URLSearchParams(search);
  const incoming: AttributionData = {};
  for (const key of CLICK_ID_PARAMS) {
    const value = params.get(key);
    if (value) incoming[key as AttributionField] = value;
  }
  for (const [param, field] of Object.entries(UTM_PARAM_MAP)) {
    const value = params.get(param);
    if (value) incoming[field] = value;
  }
  return incoming;
}

/**
 * First-touch merge: only fills fields that are currently empty in `base` —
 * an already-captured value is never overwritten by `incoming`. Same rule
 * used for the pre-consent buffer, the real cookie, and merging one into the
 * other, so "whichever value was captured first always wins" holds uniformly.
 */
function fillEmpty(
  base: AttributionData,
  incoming: AttributionData,
): { merged: AttributionData; changed: boolean } {
  let changed = false;
  const merged: AttributionData = { ...base };
  for (const field of ATTRIBUTION_FIELDS) {
    if (!merged[field] && incoming[field]) {
      merged[field] = incoming[field];
      changed = true;
    }
  }
  return { merged, changed };
}

// ── Pre-consent attribution buffer ──────────────────────────────────────────
// Bridges the gap between "visitor lands from an ad" and "visitor grants
// analytics consent" when those two moments fall on different pageviews. The
// 90-day vkh_attribution cookie below is NEVER written before consent — this
// buffer is a separate, short-lived, first-party-only holding spot for the
// SAME raw values, written unconditionally (no consent check) so a UTM/
// click-id landing isn't lost the instant the visitor navigates away before
// deciding. It is never transmitted to any server or third party (GA4, Meta,
// Google Ads, or otherwise) — it only ever moves from here into the real
// cookie, and only once consent exists (see captureAttributionClient below).
// Uses localStorage rather than sessionStorage so it survives a closed-then-
// reopened tab within the TTL window; the short TTL is what keeps pre-consent
// exposure bounded.
//
// IMPORTANT — documented risk/policy tradeoff, not a compliance guarantee:
// writing ANY non-essential data to a visitor's device before consent is,
// under a strict reading of ePrivacy/GDPR (and this project's own consent
// banner wording, which already categorises UTM/attribution capture under
// "Analytics & Attribution"), arguably still consent-requiring regardless of
// storage mechanism. This buffer never transmits anything anywhere and
// expires quickly, which meaningfully reduces risk/impact — but that does
// not make it unambiguously compliant. This tradeoff was reviewed and
// accepted deliberately (2026-08). Revisit if the privacy policy or consent
// model changes.

const BUFFER_KEY = "vkh_attribution_buffer";
// 60 minutes — long enough to cover a realistic "browse a bit before
// deciding" window (including a closed/reopened tab), short enough to keep
// pre-consent exposure bounded. Tune here only; nothing else depends on this
// value.
const BUFFER_TTL_MS = 60 * 60 * 1000;

interface AttributionBuffer {
  data: AttributionData;
  expiresAt: number;
}

function readBuffer(): AttributionBuffer | null {
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttributionBuffer;
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(BUFFER_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeBuffer(data: AttributionData, expiresAt: number): void {
  try {
    localStorage.setItem(BUFFER_KEY, JSON.stringify({ data, expiresAt }));
  } catch {
    // Storage unavailable/full/blocked (e.g. strict private browsing) — the
    // buffer is a best-effort bridge, never required for the site to work.
  }
}

function clearBuffer(): void {
  try {
    localStorage.removeItem(BUFFER_KEY);
  } catch {
    // no-op — nothing to clean up if storage isn't available anyway.
  }
}

/**
 * Call on EVERY page load, unconditionally — no consent check. No-ops on
 * internal (/admin) routes, and never touches storage at all if the current
 * URL has no attribution params and no buffer already exists. First-touch:
 * never overwrites a field the buffer already has; click-id fields can still
 * be filled in later if they're currently empty (mirrors the real cookie's
 * own upgrade rule). The buffer's TTL clock starts at its first write and is
 * never extended by later page views, keeping exposure bounded regardless of
 * how long the visitor keeps browsing.
 */
export function bufferAttributionRaw(): void {
  if (typeof window === "undefined") return;
  if (isInternalRoute(window.location.pathname)) return;

  const existing = readBuffer();
  const incoming = parseAttributionFromUrl(window.location.search);

  if (!existing && Object.keys(incoming).length === 0) return;

  if (!existing) {
    // First-ever buffer write this window — capture landingPage/referrer
    // too, same first-touch rule the real cookie uses.
    incoming.landingPage = window.location.href;
    if (document.referrer) incoming.referrer = document.referrer;
  }

  const { merged, changed } = fillEmpty(existing?.data ?? {}, incoming);
  if (existing && !changed) return; // nothing new to add — leave TTL untouched

  const expiresAt = existing?.expiresAt ?? Date.now() + BUFFER_TTL_MS;
  writeBuffer(merged, expiresAt);
}

/**
 * Call once analytics consent is granted (on load if already granted, or
 * immediately on the consent-change event otherwise — see
 * AttributionCapture.tsx). No-ops on internal (/admin) routes.
 *
 * Reads the pre-consent buffer (the true original landing page's values,
 * even if consent is granted on a later page) plus whatever's on the current
 * URL right now, first-touch-merges both into the real 90-day cookie, then
 * clears the buffer — its job is done once a real capture attempt has run,
 * whether or not it found anything new to add.
 */
export function captureAttributionClient(): void {
  if (typeof window === "undefined") return;
  if (isInternalRoute(window.location.pathname)) return;

  const existingRaw = readCookie(COOKIE_NAME);
  const existing = parseAttributionCookie(existingRaw);

  const buffered = readBuffer();
  const urlIncoming = parseAttributionFromUrl(window.location.search);
  const { merged: incoming } = fillEmpty(buffered?.data ?? {}, urlIncoming);

  if (!existingRaw) {
    // First-ever real capture. Prefer the buffer's landingPage/referrer (the
    // true original landing page) when available; fall back to the current
    // page, same as before the buffer existed.
    incoming.landingPage = buffered?.data.landingPage ?? window.location.href;
    incoming.referrer = buffered?.data.referrer ?? (document.referrer || undefined);
  }

  const { merged, changed } = fillEmpty(existing, incoming);

  if (changed) {
    const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(merged))}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }

  // The buffer's only purpose was bridging up to this point — clear it now
  // that a real, consent-backed capture attempt has run.
  clearBuffer();
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
