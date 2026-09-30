import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, mapPrismaError } from "@/lib/api/route-helpers";
import { invalidateOccasionOffer } from "@/lib/cache";
import { offerInputSchema, offerPublishBlockers } from "@/lib/offers/content";
import { offerColumns, packageColumns } from "@/lib/offers/persist";
import { syncOfferCrmTour } from "@/lib/offers/crmTour";

export const dynamic = "force-dynamic";

// Occasion Offers are tour merchandising, so they sit under the existing
// "packages" RBAC module (like Tour Collections) — no new RolePermission rows.

export async function POST(request: Request) {
  const guard = await requirePermission("packages", "create");
  if (guard instanceof NextResponse) return guard;
  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(offerInputSchema, body.data);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  if (input.published) {
    const blockers = offerPublishBlockers({
      startDate: input.startDate,
      endDate: input.endDate,
      itineraryDays: input.itinerary.length,
      packages: input.packages.map((p) => ({ ...p, nights: p.stays.length })),
    });
    if (blockers.length) {
      return NextResponse.json(
        { error: `Can't publish yet — ${blockers.join(", ")}.` },
        { status: 422 },
      );
    }
  }

  try {
    const { relatedTourIds, packages } = input;
    const offer = await prisma.occasionOffer.create({
      data: {
        ...offerColumns(input),
        name: input.name,
        slug: input.slug,
        packages: { create: packages.map(packageColumns) },
        relatedTours: { connect: relatedTourIds.map((id) => ({ id })) },
      },
      select: { id: true, slug: true },
    });
    await syncOfferCrmTour(offer.id);
    invalidateOccasionOffer({ slug: offer.slug });
    return NextResponse.json(offer, { status: 201 });
  } catch (err) {
    return mapPrismaError(err, "An offer with this URL already exists", "Create failed");
  }
}
