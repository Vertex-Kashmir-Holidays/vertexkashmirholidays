// Occasion Offers — server-only data access for the public pages, sitemap and
// navbar.
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * A published offer with its published packages (admin order) and published
 * related tours. Shared by generateMetadata() and the page — one query per
 * request. Unpublished or unknown → null (the route 404s).
 */
export const getOfferPage = cache(async (slug: string) =>
  prisma.occasionOffer.findFirst({
    where: { slug, published: true },
    include: {
      packages: {
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { priceForTwo: "asc" }],
      },
      relatedTours: {
        where: { published: true },
        orderBy: [{ bestseller: "desc" }, { rating: "desc" }],
        take: 4,
        select: { slug: true, title: true },
      },
    },
  }),
);

export type OfferPageData = NonNullable<Awaited<ReturnType<typeof getOfferPage>>>;

/**
 * Every published offer, in admin order — the /offers hub, build-time static
 * params, the sitemap and the navbar's Offers menu.
 */
export const getLiveOccasionOffers = cache(async () => {
  const offers = await prisma.occasionOffer.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      name: true,
      slug: true,
      noindex: true,
      updatedAt: true,
      occasionType: true,
      startDate: true,
      endDate: true,
      heroTitle: true,
      shortDescription: true,
      heroImage: true,
      packages: { where: { published: true }, select: { priceForTwo: true } },
    },
  });
  return offers.map(({ packages, ...o }) => ({
    ...o,
    fromPrice: packages.length ? Math.min(...packages.map((p) => p.priceForTwo)) : null,
  }));
});

/** Name, photo and link data for the destinations an offer's days/stays reference. */
export async function getOfferDestinations(slugs: string[]) {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) return [];
  return prisma.destination.findMany({
    where: { slug: { in: unique } },
    select: {
      slug: true,
      name: true,
      coverImage: true,
      tagline: true,
      excerpt: true,
      topAttractions: true,
    },
  });
}
