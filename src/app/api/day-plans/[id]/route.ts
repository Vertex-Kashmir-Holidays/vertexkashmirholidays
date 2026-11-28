import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, requireExisting } from "@/lib/api/route-helpers";
import { dayPlanPatchSchema } from "@/lib/dayPlans/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => prisma.dayPlan.findUnique({ where: { id } }));
  if (!existing.ok) return existing.response;
  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(dayPlanPatchSchema, body.data);
  if (!parsed.ok) return parsed.response;
  const plan = await prisma.dayPlan.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ plan });
}

// Deleting a plan never touches proposals that used it — they hold a copy.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => prisma.dayPlan.findUnique({ where: { id } }));
  if (!existing.ok) return existing.response;
  await prisma.dayPlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
