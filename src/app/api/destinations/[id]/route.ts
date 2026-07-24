import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, requireExisting, mapPrismaError } from "@/lib/api/route-helpers";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// Blank string → null for numeric coordinate fields so they clear cleanly.
const coord = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v) : v),
  z.number().min(-180).max(180).nullable(),
);

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
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
  const dest = await requireExisting(() => prisma.destination.findUnique({ where: { id } }));
  if (!dest.ok) return dest.response;
  return NextResponse.json(dest.data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("destinations", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => prisma.destination.findUnique({ where: { id } }));
  if (!existing.ok) return existing.response;
  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(patchSchema, body.data);
  if (!parsed.ok) return parsed.response;
  const { activityIds, ...data } = parsed.data;
  try {
    const updated = await prisma.destination.update({
      where: { id },
      data: {
        ...data,
        ...(activityIds
          ? {
              activities: {
                deleteMany: {},
                create: activityIds.map((activityId) => ({ activityId })),
              },
            }
          : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return mapPrismaError(err, "Slug already exists", "Update failed");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("destinations", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => prisma.destination.findUnique({ where: { id } }));
  if (!existing.ok) return existing.response;
  await prisma.destination.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
