import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// Blank string → null for numeric coordinate fields so they clear cleanly.
const coord = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v) : v),
  z.number().min(-180).max(180).nullable(),
);

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  coverImageMobile: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  altitude: z.string().optional().nullable(),
  season: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  latitude: coord.optional(),
  longitude: coord.optional(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  whyVisit: z.string().optional(),
  topAttractions: z.string().optional(),
  bestTimeDetail: z.string().optional().nullable(),
  howToReach: z.string().optional().nullable(),
  whereToStay: z.string().optional().nullable(),
  localFood: z.string().optional(),
  shopping: z.string().optional(),
  travelTips: z.string().optional(),
  relatedBlogIds: z.string().optional(),
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),
  activityIds: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("destinations", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const dest = await prisma.destination.findUnique({ where: { id } });
  if (!dest) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(dest);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("destinations", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.destination.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const { activityIds, ...data } = parsed.data;
  try {
    const updated = await prisma.destination.update({
      where: { id },
      data: {
        ...data,
        ...(activityIds
          ? { activities: { deleteMany: {}, create: activityIds.map((activityId) => ({ activityId })) } }
          : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("destinations", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.destination.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.destination.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
