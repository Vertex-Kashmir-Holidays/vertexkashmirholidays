// Occasion Offers — turns validated admin input (src/lib/offers/content.ts)
// into Prisma writes. Server-only; shared by the create/update/duplicate routes.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OfferPatch } from "@/lib/offers/content";

type PackageInput = NonNullable<OfferPatch["packages"]>[number];

const orNull = (v: string | undefined) => (v === undefined ? undefined : v || null);

/** Scalar/content columns of an offer write (packages + tours handled separately). */
export function offerColumns(input: OfferPatch) {
  const json = (v: unknown[] | undefined) => (v === undefined ? undefined : JSON.stringify(v));
  return {
    name: input.name,
    slug: input.slug,
    published: input.published,
    sortOrder: input.sortOrder,
    occasionType: input.occasionType,
    startDate: input.startDate,
    endDate: input.endDate,
    shortDescription: orNull(input.shortDescription),
    heroTitle: orNull(input.heroTitle),
    heroSubtitle: orNull(input.heroSubtitle),
    heroImage: orNull(input.heroImage),
    heroImageMobile: orNull(input.heroImageMobile),
    ctaLabel: orNull(input.ctaLabel),
    overview: orNull(input.overview),
    whyThisOffer: json(input.whyThisOffer),
    itinerary: json(input.itinerary),
    inclusions: json(input.inclusions),
    exclusions: json(input.exclusions),
    gallery: json(input.gallery),
    filmUrl: orNull(input.filmUrl),
    filmPoster: orNull(input.filmPoster),
    faqs: json(input.faqs),
    compareRows: json(input.compareRows),
    activitiesTitle: orNull(input.activitiesTitle),
    activitiesIntro: orNull(input.activitiesIntro),
    activitiesNote: orNull(input.activitiesNote),
    activities: json(input.activities),
    metaTitle: orNull(input.metaTitle),
    metaDesc: orNull(input.metaDesc),
    canonicalUrl: orNull(input.canonicalUrl),
    ogTitle: orNull(input.ogTitle),
    ogDesc: orNull(input.ogDesc),
    ogImage: orNull(input.ogImage),
    noindex: input.noindex,
  } satisfies Prisma.OccasionOfferUpdateInput;
}

/** Package row data; sortOrder follows the admin list order. */
export function packageColumns(p: PackageInput, index: number) {
  return {
    name: p.name,
    displayName: p.displayName,
    description: p.description || null,
    priceForTwo: p.priceForTwo,
    originalPriceForTwo: p.originalPriceForTwo ?? null,
    published: p.published,
    sortOrder: index,
    image: p.image || null,
    highlights: JSON.stringify(p.highlights),
    inclusions: JSON.stringify(p.inclusions),
    stays: JSON.stringify(p.stays),
    hotels: JSON.stringify(p.hotels),
    compareValues: JSON.stringify(p.compareValues),
    badge: p.badge || null,
    mealPlan: p.mealPlan || null,
    vehicle: p.vehicle || null,
  };
}

/**
 * Replace an offer's packages with `packages` (admin order): rows whose id is
 * kept are updated, missing ones deleted, id-less ones created. Returned as
 * batch operations so the caller commits them in one $transaction with the
 * offer update.
 */
export function syncPackagesOps(offerId: string, packages: PackageInput[]) {
  const keptIds = packages.flatMap((p) => (p.id ? [p.id] : []));
  return [
    prisma.occasionOfferPackage.deleteMany({ where: { offerId, id: { notIn: keptIds } } }),
    ...packages.map((p, i) =>
      p.id
        ? prisma.occasionOfferPackage.updateMany({
            where: { id: p.id, offerId },
            data: packageColumns(p, i),
          })
        : prisma.occasionOfferPackage.create({ data: { offerId, ...packageColumns(p, i) } }),
    ),
  ];
}
