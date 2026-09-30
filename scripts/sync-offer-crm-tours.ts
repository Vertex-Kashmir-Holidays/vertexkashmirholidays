// Creates/updates every Occasion Offer's hidden CRM tour ("Diwali Special - 5
// Nights - 6 Days", never published — see src/lib/offers/crmTour.ts), then
// tags existing offer leads that have no tour with it. Safe to re-run.
// Offer saves in Admin → Offers keep the tours in sync after this; run it once
// per database after the 20261003090000_occasion_offer_crm_tour migration and
// after seeding offers (scripts/seed-occasion-offers.ts).
//
//   npx tsx scripts/sync-offer-crm-tours.ts
import { prisma } from "../src/lib/prisma";
import { syncOfferCrmTour } from "../src/lib/offers/crmTour";

async function main() {
  const dbName = new URL(process.env.DATABASE_URL ?? "").pathname.slice(1);
  console.log(`Database: ${dbName}`);

  const offers = await prisma.occasionOffer.findMany({ select: { id: true, slug: true } });
  for (const offer of offers) {
    await syncOfferCrmTour(offer.id);
    const { crmTour } = await prisma.occasionOffer.findUniqueOrThrow({
      where: { id: offer.id },
      select: { crmTour: { select: { id: true, title: true } } },
    });
    if (!crmTour) continue;
    const { count } = await prisma.lead.updateMany({
      where: { occasionOfferId: offer.id, tourId: null },
      data: { tourId: crmTour.id },
    });
    console.log(`  ${offer.slug} → "${crmTour.title}" (${count} lead(s) tagged)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
