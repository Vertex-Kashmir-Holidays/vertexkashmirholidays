import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const priceField = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v) : v),
  z.number().min(0).nullable(),
);

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  coverImageMobile: z.string().optional().nullable(),
  images: z.string().optional(),
  location: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  price: priceField.optional(),
  published: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  whyExperience: z.string().optional().nullable(),
  activityHighlights: z.string().optional(),
  bestTime: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  suitableFor: z.string().optional(),
  pricingGuide: z.string().optional().nullable(),
  safetyTips: z.string().optional(),
  whatToCarry: z.string().optional(),
  faqs: z.string().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  destinationIds: z.array(z.string()).optional(),
  tourIds: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("activities", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      destinations: { select: { destinationId: true } },
      tours: { select: { tourId: true } },
    },
  });
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(activity);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("activities", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { destinationIds, tourIds, ...data } = parsed.data;

  try {
    const updated = await prisma.activity.update({
      where: { id },
      data: {
        ...data,
        // Re-sync the join tables only when the client sent the link arrays.
        ...(destinationIds
          ? { destinations: { deleteMany: {}, create: destinationIds.map((destinationId) => ({ destinationId })) } }
          : {}),
        ...(tourIds ? { tours: { deleteMany: {}, create: tourIds.map((tourId) => ({ tourId })) } } : {}),
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
  const guard = await requirePermission("activities", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
