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

/** Admin-only: add a budget band by its start (₹ per person). Its key (band10,
 *  …) is assigned here and never changes; ends and labels are generated. */
export async function POST(req: NextRequest) {
  const guard = await requirePermission("leads", "edit");
  if (guard instanceof NextResponse) return guard;
  if (!isAdminRole(guard.user.role)) {
    return NextResponse.json({ error: "Only an admin can manage budget bands." }, { status: 403 });
  }
  const parsed = budgetBandInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const result = await prisma.$transaction(async (tx) => {
    if (parsed.data.isActive) {
      const clash = await assertUniqueStart(tx, parsed.data.minAmount);
      if (clash) return { error: clash };
    }
    const keys = await tx.budgetBand.findMany({ select: { key: true } });
    const next = Math.max(0, ...keys.map((b) => Number(/^band(\d+)$/.exec(b.key)?.[1] ?? 0))) + 1;
    await tx.budgetBand.create({
      data: { ...parsed.data, key: `band${next}`, label: "", maxAmount: null },
    });
    await recomputeActiveBands(tx);
    return { ok: true };
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  invalidateBudgetBands();
  return NextResponse.json(result, { status: 201 });
}
