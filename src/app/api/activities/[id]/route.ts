import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, requireExisting, mapPrismaError } from "@/lib/api/route-helpers";
import { invalidateActivity } from "@/lib/cache";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const priceField = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v) : v),
  z.number().min(0).nullable(),
);

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
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
  const activity = await requireExisting(() =>
    prisma.activity.findUnique({
      where: { id },
      include: {
        destinations: { select: { destinationId: true } },
        tours: { select: { tourId: true } },
      },
    }),
  );
  if (!activity.ok) return activity.response;
  return NextResponse.json(activity.data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("activities", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() =>
    prisma.activity.findUnique({
      where: { id },
      include: {
        destinations: { select: { destination: { select: { slug: true } } } },
        tours: { select: { tour: { select: { slug: true } } } },
      },
    }),
  );
  if (!existing.ok) return existing.response;

  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(patchSchema, body.data);
  if (!parsed.ok) return parsed.response;

  const { destinationIds, tourIds, ...data } = parsed.data;

  try {
    const updated = await prisma.activity.update({
      where: { id },
      data: {
        ...data,
        // Re-sync the join tables only when the client sent the link arrays.
        ...(destinationIds
          ? {
              destinations: {
                deleteMany: {},
                create: destinationIds.map((destinationId) => ({ destinationId })),
              },
            }
          : {}),
        ...(tourIds
          ? { tours: { deleteMany: {}, create: tourIds.map((tourId) => ({ tourId })) } }
          : {}),
      },
    });

    // Cross-invalidate the tours/destinations this activity was already
    // linked to, plus any newly-linked ones if the edit changed the links.
    const destinationSlugs = existing.data.destinations.map((d) => d.destination.slug);
    const tourSlugs = existing.data.tours.map((t) => t.tour.slug);
    const [newlyLinkedDestinations, newlyLinkedTours] = await Promise.all([
      destinationIds
        ? prisma.destination.findMany({ where: { id: { in: destinationIds } }, select: { slug: true } })
        : [],
      tourIds ? prisma.tour.findMany({ where: { id: { in: tourIds } }, select: { slug: true } }) : [],
    ]);
    for (const d of newlyLinkedDestinations) destinationSlugs.push(d.slug);
    for (const t of newlyLinkedTours) tourSlugs.push(t.slug);

    invalidateActivity({
      slug: updated.slug,
      previousSlug: existing.data.slug,
      tourSlugs,
      destinationSlugs,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return mapPrismaError(err, "Slug already exists", "Update failed");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("activities", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() =>
    prisma.activity.findUnique({
      where: { id },
      include: {
        destinations: { select: { destination: { select: { slug: true } } } },
        tours: { select: { tour: { select: { slug: true } } } },
      },
    }),
  );
  if (!existing.ok) return existing.response;
  await prisma.activity.delete({ where: { id } });
  invalidateActivity({
    slug: existing.data.slug,
    tourSlugs: existing.data.tours.map((t) => t.tour.slug),
    destinationSlugs: existing.data.destinations.map((d) => d.destination.slug),
  });
  return NextResponse.json({ success: true });
}
