import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import {
  normalizeWhatsAppTokenParam,
  resolveWhatsAppAttributionToken,
} from "@/lib/whatsappAttribution.server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/**
 * Staff-only: resolves a WhatsApp attribution reference (pasted from a
 * customer's message) back into the attribution snapshot captured when the
 * token was minted (POST /api/attribution/token). Read-only — does not mark
 * the token consumed or create anything; used by the New Lead form's live
 * "Resolve" preview (src/components/admin/leads/LeadForm.tsx). The actual
 * Lead-creation route (src/app/api/admin/leads/route.ts) re-resolves the same
 * reference independently, server-side, at submit time rather than trusting
 * this preview call's result — see that file's comment for why.
 *
 * `channel` in the response is for DISPLAY only (e.g. "Google Ads" shown next
 * to the resolved reference) — see resolveWhatsAppAttributionToken()'s doc
 * comment in src/lib/whatsappAttribution.server.ts for why it must never be
 * treated as authoritative by a caller.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "create");
  if (guard instanceof NextResponse) return guard;

  const { token: rawParam } = await params;
  const token = normalizeWhatsAppTokenParam(rawParam);
  if (!token) {
    return NextResponse.json({ error: "Invalid reference format" }, { status: 400 });
  }

  const resolved = await resolveWhatsAppAttributionToken(token);

  // Same generic response for "no such token" and "expired" — a real
  // salesperson mistyping a code and a genuinely stale reference both just
  // mean "nothing to resolve"; distinguishing them tells them nothing
  // actionable and needlessly confirms whether an arbitrary token ever
  // existed.
  if (!resolved) {
    return NextResponse.json({ error: "Reference not found or expired" }, { status: 404 });
  }

  return NextResponse.json({ attribution: resolved.attribution, channel: resolved.channel });
}
