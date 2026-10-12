import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
import {
  assertUniqueStart,
  budgetBandInputSchema,
  invalidateBudgetBands,
  recomputeActiveBands,
} from "@/lib/leads/budgetBandAdmin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Admin-only: change a band's start or active flag (the key is fixed), then
 *  regenerate every active band's end and label. Existing leads keep the
 *  label they were captured with. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "edit");
  if (guard instanceof NextResponse) return guard;
  if (!isAdminRole(guard.user.role)) {
    return NextResponse.json({ error: "Only an admin can manage budget bands." }, { status: 403 });
  }
  const { id } = await params;
  const parsed = budgetBandInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const result = await prisma.$transaction(async (tx) => {
    const band = await tx.budgetBand.findUnique({ where: { id }, select: { id: true } });
    if (!band) return { error: "Not found", status: 404 };
    if (parsed.data.isActive) {
      const clash = await assertUniqueStart(tx, parsed.data.minAmount, id);
      if (clash) return { error: clash, status: 422 };
    }
    await tx.budgetBand.update({ where: { id }, data: parsed.data });
    await recomputeActiveBands(tx);
    return { ok: true };
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  invalidateBudgetBands();
  return NextResponse.json(result);
}
