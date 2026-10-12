import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/ratelimit";
import { isSameOrigin } from "@/lib/security/origin";
import { budgetBandKeyField, travelMonthField } from "@/lib/leads/qualification";
import { resolveQualification } from "@/lib/leads/budgetBands.server";

const bodySchema = z.object({
  token: z.string().trim().min(1).max(64),
  // Absent in an activity context (no budget asked).
  budgetBandKey: budgetBandKeyField.optional(),
  travelMonth: travelMonthField,
  // The band came from the tour's price, not the visitor's choice.
  budgetDerived: z.boolean().optional(),
  // True only when the visitor tapped "Open WhatsApp" (not on chip-pick).
  opened: z.boolean().optional(),
});

// Public, untrusted endpoint: saves the WhatsApp modal's lead-qualification
// answers onto the visitor's existing attribution token (same Ref tag), and
// stamps waOpenedAt once they actually open WhatsApp — so staff can tell a
// real WhatsApp intent from an abandoned modal. Only qualification columns
// are ever written; an unknown, expired or already-used token is a no-op.
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limit = await rateLimit(`attribution-qualify:ip:${clientIp(req)}`, 60, "1 h");
  if (!limit.success) return tooManyRequests(limit);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { token, opened, budgetDerived, ...answers } = parsed.data;

  const row = await prisma.whatsAppAttributionToken.findUnique({
    where: { token },
    select: { id: true, expiresAt: true, consumedAt: true, waOpenedAt: true },
  });
  if (!row || row.consumedAt || row.expiresAt < new Date()) {
    return NextResponse.json({ ok: true });
  }

  const q = await resolveQualification(answers);
  await prisma.whatsAppAttributionToken.update({
    where: { id: row.id },
    data: {
      ...(q.budgetBandKey
        ? {
            budgetBandKey: q.budgetBandKey,
            budgetBandLabel: q.budgetBandLabel,
            budgetBandDerived: !!budgetDerived,
          }
        : {}),
      ...(q.travelMonth ? { travelMonth: q.travelMonth } : {}),
      ...(opened && !row.waOpenedAt ? { waOpenedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
