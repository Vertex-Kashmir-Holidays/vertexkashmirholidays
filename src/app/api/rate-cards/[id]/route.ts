import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody } from "@/lib/api/route-helpers";
import { rateCardDataSchema, rateCardMetaSchema } from "@/lib/rateCards/schema";
import { getActivationBlockers } from "@/lib/rateCards/checks";
import {
  RateCardConflictError,
  saveRateCardData,
  validationErrorResponse,
} from "@/lib/rateCards/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  // The version the editor loaded — a stale one is rejected (409) rather
  // than silently overwriting someone else's save.
  version: z.number().int().min(1),
  meta: rateCardMetaSchema,
  data: rateCardDataSchema,
  changeNote: z.string().trim().max(300).nullable(),
});

/**
 * Save the whole card (card fields + data). Always a new version: the
 * previous data is snapshotted into RateCardRevision first. The editor sends
 * the complete card on every save — there are no partial updates.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("rateCards", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = patchSchema.safeParse(body.data);
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const { version, meta, data, changeNote } = parsed.data;

  const card = await prisma.rateCard.findUnique({ where: { id }, select: { status: true } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Sales is quoting from the ACTIVE card right now — it must stay complete.
  if (card.status === "ACTIVE") {
    const blockers = getActivationBlockers(data);
    if (blockers.length > 0) {
      return NextResponse.json(
        { error: `This card is active, so it can't be saved incomplete: ${blockers[0]}` },
        { status: 422 },
      );
    }
  }

  try {
    await prisma.$transaction((tx) =>
      saveRateCardData(tx, {
        id,
        expectedVersion: version,
        data,
        meta,
        changeNote,
        userId: guard.user.id as string,
      }),
    );
  } catch (err) {
    if (err instanceof RateCardConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const updated = await prisma.rateCard.findUnique({ where: { id }, select: { version: true } });
  return NextResponse.json({ version: updated?.version });
}
