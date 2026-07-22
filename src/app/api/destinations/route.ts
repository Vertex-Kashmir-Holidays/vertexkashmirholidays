import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, mapPrismaError } from "@/lib/api/route-helpers";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Blank string → null for the numeric coordinate fields so they clear cleanly.
const coord = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v) : v),
  z.number().min(-180).max(180).nullable(),
);

const createSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  coverImageMobile: z.string().optional(),
  location: z.string().optional(),
  altitude: z.string().optional(),
  season: z.string().optional(),
  region: z.string().optional(),
  latitude: coord.optional(),
  longitude: coord.optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
  whyVisit: z.string().optional(),
  topAttractions: z.string().optional(),
  bestTimeDetail: z.string().optional(),
  howToReach: z.string().optional(),
  whereToStay: z.string().optional(),
  localFood: z.string().optional(),
  shopping: z.string().optional(),
  travelTips: z.string().optional(),
  relatedBlogIds: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  activityIds: z.array(z.string()).optional(),
});

export async function GET() {
  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    include: {
      tours: {
        where: { tour: { published: true } },
        select: { id: true },
      },
    },
  });

  const result = destinations.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    excerpt: d.excerpt,
    coverImage: d.coverImage,
    location: d.location,
    tourCount: d.tours.length,
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const guard = await requirePermission("destinations", "create");
  if (guard instanceof NextResponse) return guard;
  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(createSchema, body.data);
  if (!parsed.ok) return parsed.response;
  const { activityIds = [], ...data } = parsed.data;
  try {
    const dest = await prisma.destination.create({
      data: { ...data, activities: { create: activityIds.map((activityId) => ({ activityId })) } },
    });
    return NextResponse.json(dest, { status: 201 });
  } catch (err) {
    return mapPrismaError(err, "Slug already exists", "Create failed");
  }
}
