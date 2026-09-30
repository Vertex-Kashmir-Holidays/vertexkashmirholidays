import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import {
  parseJsonBody,
  parseWithSchema,
  requireExisting,
  mapPrismaError,
} from "@/lib/api/route-helpers";
import { invalidateOccasionOffer } from "@/lib/cache";
import {
  offerPatchSchema,
  offerPublishBlockers,
  parseOfferItinerary,
  parseOfferStays,
} from "@/lib/offers/content";
import { offerColumns, syncPackagesOps } from "@/lib/offers/persist";
import { syncOfferCrmTour } from "@/lib/offers/crmTour";

type Params = { params: Promise<{ id: string }> };

const findOffer = (id: string) =>
  prisma.occasionOffer.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      published: true,
      startDate: true,
      endDate: true,
      itinerary: true,
      crmTourId: true,
      packages: { select: { name: true, published: true, priceForTwo: true, stays: true } },
      _count: { select: { leads: true } },
    },
  });

// Partial update — the full editor sends everything; Publish/Unpublish sends
// just `published`. Packages, when sent, replace the offer's current set.
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("packages", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => findOffer(id));
  if (!existing.ok) return existing.response;
  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(offerPatchSchema, body.data);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  const current = existing.data;

  // Validate the offer as it will be after this save, not just the fields sent.
  if (input.published ?? current.published) {
    const blockers = offerPublishBlockers({
      startDate: input.startDate !== undefined ? input.startDate : current.startDate,
      endDate: input.endDate !== undefined ? input.endDate : current.endDate,
      itineraryDays: (input.itinerary ?? parseOfferItinerary(current.itinerary)).length,
      packages: input.packages
        ? input.packages.map((p) => ({ ...p, nights: p.stays.length }))
        : current.packages.map((p) => ({ ...p, nights: parseOfferStays(p.stays).length })),
    });
    if (blockers.length) {
      return NextResponse.json(
        { error: `Can't publish yet — ${blockers.join(", ")}.` },
        { status: 422 },
      );
    }
  }

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.occasionOffer.update({
      where: { id },
      data: {
        ...offerColumns(input),
        ...(input.relatedTourIds
          ? { relatedTours: { set: input.relatedTourIds.map((tourId) => ({ id: tourId })) } }
          : {}),
      },
    }),
    ...(input.packages ? syncPackagesOps(id, input.packages) : []),
  ];

  try {
    await prisma.$transaction(ops);
    await syncOfferCrmTour(id);
    const slug = input.slug ?? current.slug;
    invalidateOccasionOffer({ slug, previousSlug: current.slug });
    return NextResponse.json({ id, slug });
  } catch (err) {
    return mapPrismaError(err, "An offer with this URL already exists", "Update failed");
  }
}

// Hard delete, like Tour Collections — but never for an offer that already
// produced leads: unpublishing takes it off the site and keeps the CRM's
// offer reference intact.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("packages", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => findOffer(id));
  if (!existing.ok) return existing.response;
  const leadCount = existing.data._count.leads;
  if (leadCount > 0) {
    return NextResponse.json(
      {
        error: `This offer has ${leadCount} lead${leadCount === 1 ? "" : "s"} — unpublish it instead of deleting.`,
      },
      { status: 409 },
    );
  }
  // Packages and related-tour links cascade; related tours are untouched.
  await prisma.occasionOffer.delete({ where: { id } });
  // Its hidden CRM tour goes too — unless a lead or booking still uses it.
  const crmTourId = existing.data.crmTourId;
  if (crmTourId) {
    const inUse = await prisma.tour.findFirst({
      where: { id: crmTourId, OR: [{ leads: { some: {} } }, { bookings: { some: {} } }] },
      select: { id: true },
    });
    if (!inUse) await prisma.tour.delete({ where: { id: crmTourId } });
  }
  invalidateOccasionOffer({ slug: existing.data.slug });
  return NextResponse.json({ success: true });
}
