// One-off, idempotent SEO copy update for the three pages Google Ads sends
// "Kashmir tour package" search traffic to (Home, Tours, Trip Planner) —
// written as a script (not inline edits) specifically so it can be re-run
// against the LIVE production DB once DATABASE_URL is pointed there, per
// request. Safe to run multiple times (plain upserts/updates, no duplication).
//
// Targets this exact Google Ads keyword set (from the Keywords report,
// several of which were showing "Below average" Landing page experience):
//   Exact:  [kashmir tour packages] [kashmir packages] [kashmir tour]
//           [kashmir trip package] [kashmir package] [srinagar tour package]
//           [kashmir family tour package] [kashmir honeymoon package]
//           [kashmir tour package with flight]
//   Phrase: "kashmir tour package price" "kashmir package with flight"
//           "kashmir package from delhi" "kashmir tour package from kerala"
//           "kashmir family tour"
//
// Scope, deliberately narrow:
//   - Homepage (SiteSettings.metaTitle/metaDesc only) — the homepage's H1
//     (HomeContent.heroTitle) already reads "Kashmir Tour Packages for
//     Autumn & Winter." and is tied to a live seasonal campaign badge, so
//     it's left untouched; only the weaker meta title/description are updated.
//   - Tours page (HomeSection key="toursHero", metaTitle/metaDescription
//     only) — its kicker/title/subtitle are already keyword-strong and
//     admin-authored, so left untouched; only the two empty meta fields
//     (currently falling back to a generic hardcoded default) are filled.
//   - Trip Planner page (TripPlannerContent singleton) — this table has
//     ZERO rows in dev right now (the page has always rendered off
//     page.tsx's hardcoded DEFAULTS), so this creates the row for the first
//     time rather than overwriting any admin-entered content.
//
// Usage: npx tsx scripts/seed-seo-keyword-alignment.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: {
      metaTitle: "Kashmir Tour Packages & Kashmir Holiday Packages",
      metaDesc:
        "Book Kashmir tour packages, Kashmir honeymoon packages and family tour packages with Vertex Kashmir Holidays — transparent pricing, Dal Lake houseboats, Gulmarg Gondola and expert local guides. Get a free quote today.",
    },
  });
  console.log("Updated SiteSettings (homepage meta title/description).");

  const toursHero = await prisma.homeSection.findUnique({ where: { key: "toursHero" } });
  if (!toursHero) {
    console.warn('No HomeSection row with key "toursHero" found — skipping Tours page update.');
  } else {
    await prisma.homeSection.update({
      where: { key: "toursHero" },
      data: {
        metaTitle: "Kashmir Tour Packages — Family, Honeymoon & Kashmir Trip Packages",
        metaDescription:
          "Compare Kashmir tour packages and Srinagar tour package options from Vertex Kashmir Holidays — honeymoon packages, family tour packages and Kashmir trip packages with flight options, transparent pricing and free quotes.",
      },
    });
    console.log('Updated HomeSection "toursHero" (Tours page meta title/description).');
  }

  await prisma.tripPlannerContent.upsert({
    where: { id: "singleton" },
    update: {
      heroKicker: "KASHMIR TOUR PACKAGES",
      heroTitle: "Kashmir Tour Packages — Plan Your Trip Your Way",
      heroSubtitle:
        "Compare real Kashmir tour packages and Kashmir holiday packages, or let our local Kashmir team build a custom Kashmir trip package — hotels, sightseeing and flight, train or bus arranged for you. Get a free quote in minutes.",
      tourKicker: "RECOMMENDED",
      tourTitle: "Kashmir Tour Packages",
      tourSubtitle:
        "Handpicked Kashmir tour packages and Kashmir family tour packages with transparent pricing — every Kashmir honeymoon package can be customized with your own hotels, activities or transport.",
      pricingTitle: "How Kashmir Tour Package Pricing Works",
      pricingBody:
        "Kashmir tour package price depends on your travel dates, trip duration, hotel category and group size — a Kashmir honeymoon package in peak season prices differently from a budget Kashmir family tour package in the off-season. Whether you're booking a Kashmir tour package with flight from Delhi, a Kashmir tour package from Kerala, or arranging your own transport, the packages below show real, current pricing per person; request a quote and our team will confirm the exact price for your dates.",
      metaTitle: "Kashmir Tour Packages & Kashmir Trip Packages | Vertex Kashmir Holidays",
      metaDescription:
        "Browse Kashmir tour packages, Kashmir honeymoon packages and Kashmir family tour packages with transparent pricing, or get a custom Kashmir trip package quote — flight, train or bus from Delhi, Kerala and anywhere in India, arranged by our local Kashmir team.",
    },
    create: {
      id: "singleton",
      heroKicker: "KASHMIR TOUR PACKAGES",
      heroTitle: "Kashmir Tour Packages — Plan Your Trip Your Way",
      heroSubtitle:
        "Compare real Kashmir tour packages and Kashmir holiday packages, or let our local Kashmir team build a custom Kashmir trip package — hotels, sightseeing and flight, train or bus arranged for you. Get a free quote in minutes.",
      tourKicker: "RECOMMENDED",
      tourTitle: "Kashmir Tour Packages",
      tourSubtitle:
        "Handpicked Kashmir tour packages and Kashmir family tour packages with transparent pricing — every Kashmir honeymoon package can be customized with your own hotels, activities or transport.",
      pricingTitle: "How Kashmir Tour Package Pricing Works",
      pricingBody:
        "Kashmir tour package price depends on your travel dates, trip duration, hotel category and group size — a Kashmir honeymoon package in peak season prices differently from a budget Kashmir family tour package in the off-season. Whether you're booking a Kashmir tour package with flight from Delhi, a Kashmir tour package from Kerala, or arranging your own transport, the packages below show real, current pricing per person; request a quote and our team will confirm the exact price for your dates.",
      metaTitle: "Kashmir Tour Packages & Kashmir Trip Packages | Vertex Kashmir Holidays",
      metaDescription:
        "Browse Kashmir tour packages, Kashmir honeymoon packages and Kashmir family tour packages with transparent pricing, or get a custom Kashmir trip package quote — flight, train or bus from Delhi, Kerala and anywhere in India, arranged by our local Kashmir team.",
    },
  });
  console.log("Upserted TripPlannerContent (Trip Planner page hero/tour/pricing/meta copy).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
