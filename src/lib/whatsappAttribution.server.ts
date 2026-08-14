// Server-only helper for the WhatsApp attribution-token bridge. Mints a short
// opaque token from an already-validated attribution snapshot (see
// src/lib/attribution.ts — ATTRIBUTION_FIELDS is the single source of truth
// for the field list this mirrors) and stores it as a WhatsAppAttributionToken
// row for later lookup once a salesperson creates the CRM Lead. Never import
// this from a "use client" component — see src/lib/attribution.ts for the
// client-safe half of this feature.

import { randomBytes } from "crypto";
import { Prisma, type LeadSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ATTRIBUTION_FIELDS, pickAttribution, type AttributionData } from "@/lib/attribution";
import { deriveChannel } from "@/lib/attribution.server";

// A WhatsApp attribution token bridges "visitor sends a WhatsApp message" to
// "salesperson creates the CRM Lead" — a human sales-response process, not the
// visitor's browsing session. That's a materially shorter lifecycle than the
// 90-day vkh_attribution cookie (which governs first-touch ad-click retention
// across return visits), so this TTL is deliberately not copied from it.
// 30 days comfortably covers realistic sales backlogs (the lead-dedupe window
// elsewhere in the app is 15 days) without leaving a token usable indefinitely.
export const WHATSAPP_ATTRIBUTION_TOKEN_TTL_DAYS = 30;

// 6 random bytes -> 8 base64url characters, 48 bits of entropy. Short enough
// to sit comfortably inside a WhatsApp message, unpredictable/non-sequential
// by construction (crypto.randomBytes), and consistent with the project's
// existing secure-random-string pattern (src/lib/bookings/customer.ts uses
// the same randomBytes(...).toString("base64url") shape for temp passwords).
// The database's @unique constraint on `token` remains the final uniqueness
// guarantee — this is just what keeps a collision astronomically unlikely.
const TOKEN_BYTES = 6;
const MAX_GENERATE_ATTEMPTS = 5;

// base64url's alphabet includes "-", so a naive encode can start with one —
// awkward for a human-facing reference like "W--Sf5v136". Rejection-sampled
// regeneration (not stripping/replacing a character) keeps every accepted
// token uniformly random over the full alphabet, same entropy per character,
// same length — only ~1/64 of raw draws are ever rejected, so this loop
// terminates immediately in practice.
function generateToken(): string {
  let token: string;
  do {
    token = randomBytes(TOKEN_BYTES).toString("base64url");
  } while (token.startsWith("-"));
  return token;
}

/** True when at least one attribution field carries a real (non-empty) value. */
export function hasAttributionData(attribution: AttributionData): boolean {
  return ATTRIBUTION_FIELDS.some((field) => Boolean(attribution[field]));
}

/**
 * Creates a WhatsAppAttributionToken row from an already-validated attribution
 * snapshot and returns its token. Retries with a fresh token on a unique-
 * constraint collision (P2002) rather than failing the request outright —
 * astronomically unlikely at 48 bits, but cheap to guard regardless.
 *
 * Deliberately does not decide whether to call this at all — callers (the
 * API route) are responsible for skipping empty snapshots via
 * hasAttributionData() first, so this function's job stays singular: mint and
 * persist a token.
 */
export async function createWhatsAppAttributionToken(
  attribution: AttributionData,
): Promise<string> {
  const expiresAt = new Date(
    Date.now() + WHATSAPP_ATTRIBUTION_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  // Explicit field-by-field pick (rather than spreading `attribution`
  // directly) so this row can never pick up a stray key even if the schema
  // that validated `attribution` upstream ever changes — only the 12 known
  // attribution columns are ever written here.
  const data: Prisma.WhatsAppAttributionTokenCreateInput = { token: "", expiresAt };
  for (const field of ATTRIBUTION_FIELDS) {
    const value = attribution[field];
    if (value) data[field] = value;
  }

  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt++) {
    const token = generateToken();
    try {
      await prisma.whatsAppAttributionToken.create({ data: { ...data, token } });
      return token;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue; // token collision — retry with a fresh one
      }
      throw err;
    }
  }
  throw new Error("Failed to generate a unique WhatsApp attribution token");
}

// A raw WhatsAppAttributionToken.token is always exactly 8 base64url
// characters (TOKEN_BYTES=6 -> 8 chars, no padding). The WhatsApp message
// shows a display reference instead — a single-letter channel prefix + "-" +
// the raw token, e.g. "G-CgVI13IE" — so a salesperson may paste either form.
// The fixed 8-char length is what makes the two shapes unambiguous: a bare
// token can never be mistaken for "prefix-token", even one that itself starts
// with "-" (pre-dating the generateToken() fix above).
const RAW_TOKEN_RE = /^[A-Za-z0-9_-]{8}$/;
const PREFIXED_TOKEN_RE = /^[A-Za-z]-([A-Za-z0-9_-]{8})$/;

/**
 * Normalizes a pasted WhatsApp reference down to the raw database token.
 * Accepts both "G-CgVI13IE" (what the WhatsApp message actually shows) and a
 * bare "CgVI13IE". Returns null for anything that matches neither shape. The
 * prefix itself is discarded here, never inspected — see
 * resolveWhatsAppAttributionToken()'s doc comment for why.
 */
export function normalizeWhatsAppTokenParam(raw: string): string | null {
  if (RAW_TOKEN_RE.test(raw)) return raw;
  const match = PREFIXED_TOKEN_RE.exec(raw);
  return match ? match[1] : null;
}

export interface ResolvedWhatsAppAttribution {
  attribution: AttributionData;
  /** For DISPLAY only (e.g. "Google Ads" in the New Lead form) — never the
   *  source of truth for what a Lead's `source` gets set to. Whoever persists
   *  a Lead from this must call deriveChannel() again themselves at the
   *  moment of creation, exactly as this function does, rather than trust a
   *  value that passed through the browser in between. */
  channel: LeadSource;
}

/**
 * Resolves an already-normalized raw token (see normalizeWhatsAppTokenParam)
 * to its stored attribution, or null if the token doesn't exist or has
 * expired. The channel is derived here via the existing deriveChannel() —
 * the one place attribution signals become a marketing channel — so nothing
 * downstream needs its own copy of that logic. Never trusts the reference's
 * display prefix (G-/M-/W-): that's discarded during normalization and plays
 * no part in this result, so a tampered or mismatched prefix pasted by a
 * salesperson has zero effect on what's returned.
 *
 * Shared by the lookup endpoint (src/app/api/admin/leads/attribution/[token]/route.ts,
 * used for the New Lead form's live "Resolve" preview) and the Lead-creation
 * route (src/app/api/admin/leads/route.ts, which re-resolves independently at
 * submit time rather than trusting whatever the browser echoes back).
 */
export async function resolveWhatsAppAttributionToken(
  token: string,
): Promise<ResolvedWhatsAppAttribution | null> {
  const row = await prisma.whatsAppAttributionToken.findUnique({ where: { token } });
  if (!row || row.expiresAt < new Date()) return null;

  const attribution = pickAttribution(row);
  return { attribution, channel: deriveChannel(attribution) };
}
