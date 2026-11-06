import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema } from "@/lib/api/route-helpers";
import { dayPlanInputSchema } from "@/lib/dayPlans/schema";

export const dynamic = "force-dynamic";

/**
 * Day plans for the picker and the library page. `?all=1` includes inactive
 * plans (library page); the picker gets active plans only. Small table —
 * returned whole, filtered client-side by route/season.
 */
export async function GET(req: NextRequest) {
  const guard = await requirePermission("itinerary", "view");
  if (guard instanceof NextResponse) return guard;
  const all = req.nextUrl.searchParams.get("all") === "1";
  const plans = await prisma.dayPlan.findMany({
    where: all ? {} : { isActive: true },
    orderBy: [{ fromPlace: "asc" }, { toPlace: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      fromPlace: true,
      toPlace: true,
      title: true,
      body: true,
      season: true,
      isActive: true,
      sortOrder: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("itinerary", "create");
  if (guard instanceof NextResponse) return guard;
  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(dayPlanInputSchema, body.data);
  if (!parsed.ok) return parsed.response;
  const plan = await prisma.dayPlan.create({
    data: { ...parsed.data, createdById: guard.user.id as string },
  });
  return NextResponse.json({ plan }, { status: 201 });
}
