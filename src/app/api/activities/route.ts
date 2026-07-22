import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, mapPrismaError } from "@/lib/api/route-helpers";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Blank string → null for the optional numeric price.
const priceField = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v) : v),
  z.number().min(0).nullable(),
);

const createSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  coverImageMobile: z.string().optional(),
  images: z.string().optional(), // JSON string array
  location: z.string().optional(),
  icon: z.string().optional(),
  duration: z.string().optional(),
  price: priceField.optional(),
  published: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  whyExperience: z.string().optional(),
  activityHighlights: z.string().optional(),
  bestTime: z.string().optional(),
  difficulty: z.string().optional(),
  suitableFor: z.string().optional(),
  pricingGuide: z.string().optional(),
  safetyTips: z.string().optional(),
  whatToCarry: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
  destinationIds: z.array(z.string()).optional(),
  tourIds: z.array(z.string()).optional(),
});

export async function GET() {
  const guard = await requirePermission("activities", "view");
  if (guard instanceof NextResponse) return guard;

  const activities = await prisma.activity.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      coverImage: true,
      location: true,
      duration: true,
      price: true,
      published: true,
      _count: { select: { destinations: true, tours: true } },
    },
  });
  return NextResponse.json(activities);
}

export async function POST(request: Request) {
  const guard = await requirePermission("activities", "create");
  if (guard instanceof NextResponse) return guard;

  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(createSchema, body.data);
  if (!parsed.ok) return parsed.response;

  const { destinationIds = [], tourIds = [], ...data } = parsed.data;

  try {
    const activity = await prisma.activity.create({
      data: {
        ...data,
        destinations: { create: destinationIds.map((destinationId) => ({ destinationId })) },
        tours: { create: tourIds.map((tourId) => ({ tourId })) },
      },
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (err) {
    return mapPrismaError(err, "Slug already exists", "Create failed");
  }
}
