import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { TourCategory } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  category: z.enum(["HONEYMOON", "FAMILY", "ADVENTURE", "LUXURY", "BUDGET", "GROUP", "PILGRIMAGE", "PREMIUM"]).optional(),
  duration: z.coerce.number().int().min(1).optional(),
  excerpt: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  gallery: z.string().optional(),
  itinerary: z.string().optional(),
  inclusions: z.string().optional(),
  exclusions: z.string().optional(),
  batches: z.string().optional(),
  priceFrom: z.coerce.number().positive().optional(),
  minPersons: z.coerce.number().int().min(1).optional(),
  priceWas: z.coerce.number().positive().optional().nullable(),
  discountPct: z.coerce.number().int().min(0).max(100).optional().nullable(),
  bestseller: z.boolean().optional(),
  published: z.boolean().optional(),
  formMode: z.enum(["BOOKING_ONLY", "INQUIRY_ONLY", "BOTH"]).optional(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  activityIds: z.array(z.string()).optional(),
  region: z.enum(["KASHMIR", "LADAKH"]).optional(),
  badge: z.string().optional().nullable(),
  badgeColor: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  bestTime: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  startCity: z.string().optional().nullable(),
  pickupDrop: z.string().optional().nullable(),
  transport: z.string().optional().nullable(),
  tourType: z.string().optional().nullable(),
  happyCount: z.coerce.number().int().min(0).optional().nullable(),
  highlights: z.string().optional(),
  faqs: z.string().optional(),
  perfectFor: z.string().optional(),
  notIdealFor: z.string().optional(),
  whyItineraryWorks: z.string().optional().nullable(),
  accommodation: z.string().optional(),
  meals: z.string().optional().nullable(),
  transportDetail: z.string().optional().nullable(),
  budgetBreakdown: z.string().optional(),
  personalExpenses: z.string().optional(),
  bestTimeDetail: z.string().optional().nullable(),
  thingsToCarry: z.string().optional(),
  localTravelTips: z.string().optional(),
  importantNotes: z.string().optional(),
  whyVertexBlurb: z.string().optional().nullable(),
  ctaHeadline: z.string().optional().nullable(),
  ctaBody: z.string().optional().nullable(),
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),
  relatedTours: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("packages", "view");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const tour = await prisma.tour.findUnique({ where: { id } });
  if (!tour) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tour);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("packages", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.tour.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { category, activityIds, ...rest } = parsed.data;
  try {
    const updated = await prisma.tour.update({
      where: { id },
      data: {
        ...rest,
        ...(category ? { category: category as TourCategory } : {}),
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
  const guard = await requirePermission("packages", "delete");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.tour.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.tour.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
