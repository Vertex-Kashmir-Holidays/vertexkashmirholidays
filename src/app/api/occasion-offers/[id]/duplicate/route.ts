import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { requireExisting } from "@/lib/api/route-helpers";
import { syncOfferCrmTour } from "@/lib/offers/crmTour";

type Params = { params: Promise<{ id: string }> };

// Starting point for next season's campaign (e.g. Diwali 2027 from Diwali
// 2026): same content, packages and related tours, saved as an unpublished
// draft at "<slug>-copy" for marketing to re-date, re-price and rename.
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("packages", "create");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() =>
    prisma.occasionOffer.findUnique({
      where: { id },
      include: {
        packages: { orderBy: { sortOrder: "asc" } },
        relatedTours: { select: { id: true } },
      },
    }),
  );
  if (!existing.ok) return existing.response;
  const {
    id: _id,
    slug,
    name,
    createdAt: _c,
    updatedAt: _u,
    // The copy gets its own hidden CRM tour (synced below).
    crmTourId: _t,
    packages,
    relatedTours,
    ...content
  } = existing.data;

  const taken = async (s: string) =>
    !!(await prisma.occasionOffer.findUnique({ where: { slug: s }, select: { id: true } }));
  let copySlug = `${slug}-copy`;
  for (let n = 2; await taken(copySlug); n++) copySlug = `${slug}-copy-${n}`;

  const copy = await prisma.occasionOffer.create({
    data: {
      ...content,
      name: `${name} (Copy)`,
      slug: copySlug,
      published: false,
      packages: {
        create: packages.map(({ id: _p, offerId: _o, createdAt: _pc, updatedAt: _pu, ...p }) => p),
      },
      relatedTours: { connect: relatedTours },
    },
    select: { id: true },
  });
  await syncOfferCrmTour(copy.id);
  return NextResponse.json(copy, { status: 201 });
}
