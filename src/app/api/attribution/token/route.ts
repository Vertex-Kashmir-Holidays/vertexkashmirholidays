import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/ratelimit";
import { isSameOrigin } from "@/lib/security/origin";
import { attributionSchema } from "@/lib/attribution";
import { deriveChannel } from "@/lib/attribution.server";
import { LeadSource } from "@prisma/client";
import {
  createWhatsAppAttributionToken,
  hasAttributionData,
} from "@/lib/whatsappAttribution.server";

// Single-letter display prefix for the WhatsApp reference tag (e.g.
// "G-CgVI13IE"). Reuses deriveChannel() — the one existing place attribution
// signals are turned into a marketing channel — rather than re-deriving the
// channel from raw gclid/fbclid/UTM values a second time; this is purely a
// presentational label on top of that single classification.
function displayPrefix(channel: LeadSource): string {
  if (channel === LeadSource.GOOGLE_ADS) return "G";
  if (channel === LeadSource.META_ADS) return "M";
  return "W";
}

// Public, untrusted endpoint: mints a short-lived WhatsAppAttributionToken from
// a client-supplied attribution snapshot, later resolved by staff when
// creating a CRM Lead from a WhatsApp conversation (see
// src/lib/whatsappAttribution.server.ts). Only POST — nothing here is meant
// to be read/listed/deleted by a client.
export async function POST(req: NextRequest) {
  // Reject cross-site scripted POSTs before doing any work — same guard used
  // by the other hand-rolled public mutation routes (leads, newsletter).
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  // Per-IP throttle. Generous enough for legitimate single-session traffic
  // (including a shared/NAT'd IP) while bounding abuse of a public,
  // unauthenticated row-creation endpoint.
  const ip = clientIp(req);
  const limit = await rateLimit(`attribution-token:ip:${ip}`, 20, "1 h");
  if (!limit.success) {
    return tooManyRequests(limit);
  }

  // Whitelist via the existing shared schema — only the 12 known attribution
  // fields are ever accepted; anything else in the body is silently dropped
  // by Zod's default object-parsing behaviour. createdAt/expiresAt/consumedAt/
  // id are never client-supplied — the schema doesn't define them, so an
  // attacker-controlled value for those can never reach the database.
  const parsed = attributionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid attribution data" }, { status: 400 });
  }

  // A visitor with no meaningful attribution (no UTM/click-id/landing page/
  // referrer at all — e.g. a direct/organic visit with a clean URL) has
  // nothing worth bridging across the WhatsApp gap. Avoid creating an empty
  // row for every such request; `token: null` tells the caller there's
  // nothing to embed, without treating it as an error.
  if (!hasAttributionData(parsed.data)) {
    return NextResponse.json({ token: null }, { status: 200 });
  }

  const token = await createWhatsAppAttributionToken(parsed.data);
  const prefix = displayPrefix(deriveChannel(parsed.data));
  return NextResponse.json({ token, prefix }, { status: 201 });
}
