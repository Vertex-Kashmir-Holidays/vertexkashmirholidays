import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Clone a card as a new DRAFT (version 1, no history) so next season starts
 * from this one. Dates and name are copied as-is — the editor is where they
 * get changed for the new season.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("rateCards", "create");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const source = await prisma.rateCard.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy = await prisma.rateCard.create({
    data: {
      name: `${source.name} (copy)`,
      seasonLabel: source.seasonLabel,
      startDate: source.startDate,
      endDate: source.endDate,
      notes: source.notes,
      data: source.data as Prisma.InputJsonValue,
      status: "DRAFT",
      updatedById: guard.user.id as string,
    },
    select: { id: true },
  });

  return NextResponse.json(copy, { status: 201 });
}
