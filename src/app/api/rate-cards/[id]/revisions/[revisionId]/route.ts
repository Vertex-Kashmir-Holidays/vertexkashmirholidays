import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody } from "@/lib/api/route-helpers";
import { getActivationBlockers } from "@/lib/rateCards/checks";
import {
  RateCardConflictError,
  parseRateCardData,
  saveRateCardData,
  validationErrorResponse,
} from "@/lib/rateCards/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; revisionId: string }> };

async function findRevision(id: string, revisionId: string) {
  return prisma.rateCardRevision.findFirst({
    where: { id: revisionId, rateCardId: id },
    select: { version: true, data: true },
  });
}

/** One old version's data, for viewing before a restore. */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("rateCards", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id, revisionId } = await params;

  const revision = await findRevision(id, revisionId);
  if (!revision) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ version: revision.version, data: revision.data });
}

const restoreSchema = z.object({ version: z.number().int().min(1) });

/**
 * Restore an old version's data. This is a normal save — the current data is
 * snapshotted and the card moves to a NEW version — so history is never
 * rewritten and the restore itself can be undone.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("rateCards", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id, revisionId } = await params;

  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = restoreSchema.safeParse(body.data);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const [card, revision] = await Promise.all([
    prisma.rateCard.findUnique({ where: { id }, select: { status: true } }),
    findRevision(id, revisionId),
  ]);
  if (!card || !revision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = parseRateCardData(revision.data);
  if (!data) {
    return NextResponse.json({ error: "That version's data no longer passes validation" }, { status: 422 });
  }
  if (card.status === "ACTIVE" && getActivationBlockers(data).length > 0) {
    return NextResponse.json(
      { error: "That version is incomplete, so it can't be restored onto the active card." },
      { status: 422 },
    );
  }

  try {
    await prisma.$transaction((tx) =>
      saveRateCardData(tx, {
        id,
        expectedVersion: parsed.data.version,
        data,
        changeNote: `Restored version ${revision.version}`,
        userId: guard.user.id as string,
      }),
    );
  } catch (err) {
    if (err instanceof RateCardConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
