import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Version history, newest first — metadata only; data is fetched per revision. */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("rateCards", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const revisions = await prisma.rateCardRevision.findMany({
    where: { rateCardId: id },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      changeNote: true,
      createdAt: true,
      createdBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(
    revisions.map((r) => ({
      id: r.id,
      version: r.version,
      changeNote: r.changeNote,
      createdAt: r.createdAt.toISOString(),
      createdByName: r.createdBy?.name ?? r.createdBy?.email ?? null,
    })),
  );
}
