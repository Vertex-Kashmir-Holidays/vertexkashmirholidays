import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { getActivationBlockers } from "@/lib/rateCards/checks";
import { parseRateCardData } from "@/lib/rateCards/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Make this the card sales quotes from. Only one card is ever ACTIVE: the
 * currently active one (if any) is archived in the same transaction.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("rateCards", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const card = await prisma.rateCard.findUnique({ where: { id }, select: { status: true, data: true } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (card.status === "ACTIVE") {
    return NextResponse.json({ error: "This card is already active" }, { status: 422 });
  }

  const data = parseRateCardData(card.data);
  if (!data) {
    return NextResponse.json({ error: "This card's data is invalid — open and re-save it first" }, { status: 422 });
  }
  const blockers = getActivationBlockers(data);
  if (blockers.length > 0) {
    return NextResponse.json({ error: blockers.join(" ") }, { status: 422 });
  }

  await prisma.$transaction([
    prisma.rateCard.updateMany({
      where: { status: "ACTIVE", id: { not: id } },
      data: { status: "ARCHIVED" },
    }),
    prisma.rateCard.update({ where: { id }, data: { status: "ACTIVE" } }),
  ]);

  return NextResponse.json({ ok: true });
}
