// Each Occasion Offer is mirrored by a hidden Tour — "Diwali Special - 5 Nights
// - 6 Days" — so staff can tag leads with it in the CRM's Tour picker, and the
// offer's packages (Comfort / 3-Star …) appear as that tour's package options.
// The tour is never published: it doesn't show on the tours website. Created
// on first save and re-synced (title, duration, prices, packages) on every
// offer save. Server-only.
import { prisma } from "@/lib/prisma";
import { OCCASION_LABELS, parseOfferStays, tripNights } from "@/lib/offers/content";
import type { TourPackageOption } from "@/types/tours";

export async function syncOfferCrmTour(offerId: string): Promise<void> {
  const offer = await prisma.occasionOffer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      slug: true,
      name: true,
      occasionType: true,
      startDate: true,
      endDate: true,
      crmTourId: true,
      packages: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!offer) return;

  const nights =
    tripNights(offer.startDate, offer.endDate) ??
    Math.max(0, ...offer.packages.map((p) => parseOfferStays(p.stays).length));
  const label =
    offer.occasionType === "OTHER" ? offer.name : `${OCCASION_LABELS[offer.occasionType]} Special`;
  const title = nights ? `${label} - ${nights} Nights - ${nights + 1} Days` : label;

  const packageOptions: TourPackageOption[] = offer.packages.map((p) => ({
    id: p.id,
    name: p.name,
    hotel: "",
    transport: p.vehicle ?? "",
    meals: p.mealPlan ?? "",
    inclusions: [],
    priceForTwo: p.priceForTwo,
    published: p.published,
  }));
  const prices = offer.packages.map((p) => p.priceForTwo);

  const data = {
    title,
    duration: nights + 1,
    priceFrom: prices.length ? Math.min(...prices) : 0,
    packageOptions: JSON.stringify(packageOptions),
    excerpt: `CRM tag for the "${offer.name}" offer — managed from Admin → Offers. Keep unpublished.`,
    published: false,
  };

  if (offer.crmTourId) {
    await prisma.tour.update({ where: { id: offer.crmTourId }, data });
    return;
  }
  const tour = await prisma.tour.create({
    data: { ...data, slug: `offer-${offer.slug}-${offer.id.slice(-6)}`, category: "FAMILY" },
    select: { id: true },
  });
  await prisma.occasionOffer.update({ where: { id: offer.id }, data: { crmTourId: tour.id } });
}
