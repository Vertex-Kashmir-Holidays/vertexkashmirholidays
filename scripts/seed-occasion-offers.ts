// One-off seed: the three initial Occasion Offers (Admin → Offers).
//
//  - Diwali 2026: the STRUCTURE only — fixed dates (6–11 Nov 2026, 5N/6D), the
//    day-by-day route (Srinagar · Pahalgam · Gulmarg · Sonamarg), the four
//    plans with their starting prices for 2 adults, and each plan's night
//    split (Comfort 4N Srinagar + 1N Houseboat; 3-Star 3N Srinagar + 1N Pahalgam + 1N
//    Houseboat; 4/5-Star 2N Srinagar + 1N Gulmarg + 1N Pahalgam + 1N
//    Houseboat) and its Compare Plans extras (Shikara in every plan, Gondola from
//    3-Star, ABC Union from 4-Star, Sonamarg Union in 5-Star). Day text, hotel
//    names, inclusions, FAQs and photos are left
//    for marketing to fill in admin — nothing invented. Prices are defaults.
//  - Christmas week (22–27 Dec 2026) and New Year week (28 Dec 2026 – 2 Jan
//    2027, with the night of 31 Dec in Gulmarg): same structure plus optional
//    snow activities. Their prices are placeholders copied from Diwali — set
//    peak-season rates in admin.
//  - Two starter transport banners for the offer-page banner slots.
//
// All three are created UNPUBLISHED: review the content and images in admin,
// then publish (publishing needs the dates, a full day-by-day itinerary, and
// a priced plan with a stay for every night).
// Create-only and idempotent: an offer whose slug already exists is skipped,
// never overwritten, so re-running can't clobber admin edits.
//
// Usage: npx tsx --env-file=.env scripts/seed-occasion-offers.ts
// Uses whatever DATABASE_URL is active — run on dev first, then on live after
// all four occasion-offer migrations (20260927…–20260930…) are applied there.

import { PrismaClient, type Prisma } from "@prisma/client";
import type { OfferItineraryDay, OfferStay } from "../src/lib/offers/content";

const prisma = new PrismaClient();

const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const day = (destination: string): OfferItineraryDay => ({
  destination,
  title: "",
  description: "",
  highlights: [],
  image: "",
});

const stay = (
  destination: string,
  category: string,
  stayType: OfferStay["stayType"] = "HOTEL",
) => ({
  destination,
  stayType,
  category: stayType === "HOUSEBOAT" ? "" : category,
});

// Night N is spent after day N: Srinagar → Pahalgam → Pahalgam → Gulmarg →
// Sonamarg → departure. Comfort stays in Srinagar (day trips), last night on a
// houseboat. Christmas week uses the same route and splits.
const DIWALI_ROUTE = ["srinagar", "pahalgam", "pahalgam", "gulmarg", "sonamarg", "srinagar"];
const budgetSplit = (category: string) => [
  ...Array.from({ length: 4 }, () => stay("srinagar", category)),
  stay("srinagar", category, "HOUSEBOAT"),
];
const splitFor = (category: string): OfferStay[] => {
  if (category === "Comfort") return budgetSplit(category);
  const gulmarg = category === "3-Star" ? "srinagar" : "gulmarg";
  return [
    stay("srinagar", category),
    stay("pahalgam", category),
    stay("srinagar", category),
    stay(gulmarg, category),
    stay("srinagar", category, "HOUSEBOAT"),
  ];
};

// Compare Plans extras: Shikara in every plan, Gondola from 3-Star, ABC Union
// from 4-Star, Sonamarg Union in 5-Star only; ATV listed but in no plan (add-on).
const DIWALI_COMPARE_ROWS = [
  { id: "gondola", group: "Activities", label: "Gondola ride" },
  { id: "shikara", group: "Activities", label: "Shikara ride" },
  { id: "atv", group: "Activities", label: "ATV ride" },
  { id: "abc-union", group: "Transport", label: "ABC Union (Pahalgam)" },
  { id: "sonamarg-union", group: "Transport", label: "Sonamarg Union" },
];
const compareValuesFor = (name: string) => {
  const rank = ["Comfort", "3-Star", "4-Star", "5-Star"].indexOf(name);
  const yes = (included: boolean) => (included ? "Included" : "Not included");
  return {
    gondola: yes(rank >= 1),
    shikara: "Included",
    atv: "Not included",
    "abc-union": yes(rank >= 2),
    "sonamarg-union": yes(rank >= 3),
  };
};

// New Year week (28 Dec → 2 Jan): night 4 is 31 December, spent in Gulmarg.
// Srinagar → Pahalgam → Gulmarg → Gulmarg (New Year's Eve) → Sonamarg →
// departure. 4/5-Star: 2 Gulmarg nights (30th + 31st); 3-Star: only the 31st;
// Comfort: Srinagar + houseboat as for the other offers.
const NEW_YEAR_ROUTE = ["srinagar", "pahalgam", "gulmarg", "gulmarg", "sonamarg", "srinagar"];
const newYearSplitFor = (category: string): OfferStay[] => {
  if (category === "Comfort") return budgetSplit(category);
  return [
    stay("srinagar", category),
    stay("pahalgam", category),
    stay(category === "3-Star" ? "srinagar" : "gulmarg", category),
    stay("gulmarg", category),
    stay("srinagar", category, "HOUSEBOAT"),
  ];
};

const tier = (
  sortOrder: number,
  name: string,
  priceForTwo: number,
  split: (category: string) => OfferStay[] = splitFor,
): Prisma.OccasionOfferPackageCreateWithoutOfferInput => ({
  name,
  displayName: name,
  priceForTwo,
  sortOrder,
  published: true,
  stays: JSON.stringify(split(name)),
  compareValues: JSON.stringify(compareValuesFor(name)),
});

// Optional snow activities for the winter offers — add-ons, not in the price.
const WINTER_IMG = "https://res.cloudinary.com/dgvyci9jk/image/upload";
const SNOW_ACTIVITIES = {
  activitiesTitle: "Snow Activities",
  activitiesIntro:
    "Optional add-ons for your winter trip — not included in the package price. Tell us what you'd like and we'll arrange it.",
  activitiesNote:
    "Snow activities depend on snowfall and weather on the day; prices vary by season and are confirmed when you book.",
  activities: JSON.stringify([
    {
      title: "Skiing",
      description:
        "Beginner and intermediate ski sessions on Gulmarg's snow slopes, with gear on hire.",
      priceNote: "",
      image: `${WINTER_IMG}/v1787429614/vertex-kashmir/prod/winter-package/1787429614001-cn3bjl.webp`,
    },
    {
      title: "Sledge ride",
      description:
        "A classic ride down the snow on a wooden sledge — a favourite with families and kids.",
      priceNote: "",
      image: `${WINTER_IMG}/v1787429617/vertex-kashmir/prod/winter-package/1787429616950-3pri6f.webp`,
    },
    {
      title: "Pony ride",
      description: "Pony rides to snow points and viewpoints in Gulmarg, Pahalgam and Sonamarg.",
      priceNote: "",
      image: "/hero/gulmarg-winter-lg.webp",
    },
  ]),
};

// Christmas / New Year prices are PLACEHOLDERS copied from Diwali — peak
// season rates must be set in Admin → Offers before publishing.
const plans = (split?: (category: string) => OfferStay[]) => ({
  create: [
    tier(0, "Comfort", 21_000, split),
    tier(1, "3-Star", 32_000, split),
    tier(2, "4-Star", 45_000, split),
    tier(3, "5-Star", 65_000, split),
  ],
});

const OFFERS: Prisma.OccasionOfferCreateInput[] = [
  {
    name: "Diwali Kashmir Tour Package 2026",
    slug: "diwali-kashmir-tour-package-2026",
    occasionType: "DIWALI",
    sortOrder: 1,
    startDate: date("2026-11-06"),
    endDate: date("2026-11-11"),
    itinerary: JSON.stringify(DIWALI_ROUTE.map(day)),
    compareRows: JSON.stringify(DIWALI_COMPARE_ROWS),
    packages: plans(),
  },
  {
    name: "Christmas Kashmir Tour Package 2026",
    slug: "christmas-kashmir-tour-package-2026",
    occasionType: "CHRISTMAS",
    sortOrder: 2,
    startDate: date("2026-12-22"),
    endDate: date("2026-12-27"),
    itinerary: JSON.stringify(DIWALI_ROUTE.map(day)),
    compareRows: JSON.stringify(DIWALI_COMPARE_ROWS),
    ...SNOW_ACTIVITIES,
    packages: plans(),
  },
  {
    name: "New Year Kashmir Tour 2027",
    slug: "new-year-kashmir-tour-2027",
    occasionType: "NEW_YEAR",
    sortOrder: 3,
    startDate: date("2026-12-28"),
    endDate: date("2027-01-02"),
    itinerary: JSON.stringify(NEW_YEAR_ROUTE.map(day)),
    compareRows: JSON.stringify(DIWALI_COMPARE_ROWS),
    ...SNOW_ACTIVITIES,
    packages: plans(newYearSplitFor),
  },
];

// Starter transport banners for the two offer-page slots (Admin → Banners),
// created only when nothing targets the slot yet.
const OFFER_BANNERS: Prisma.BannerCreateInput[] = [
  {
    type: "PROMO",
    layout: "SPLIT",
    pages: JSON.stringify(["offer-after-plans"]),
    kicker: "Getting to Kashmir",
    title: "Flights & trains to your offer dates",
    subtitle: "Arranged with your package",
    body: "Tell us your city — we compare flights to Srinagar and trains to Jammu/Katra for your travel dates and time your airport pickup to your arrival.",
    features: JSON.stringify([
      { icon: "plane", title: "Flights", text: "Direct & connecting to Srinagar" },
      { icon: "train", title: "Trains", text: "To Jammu, Katra & Srinagar" },
      { icon: "car", title: "Pickup", text: "Timed to your arrival" },
    ]),
    ctaLabel: "Get Travel Options",
    ctaUrl: "/plan-your-kashmir-trip#trip-planner-form",
    imageUrl: "/hero/srinagar-lg.webp",
    imageMobileUrl: "/hero/srinagar.webp",
  },
  {
    type: "PROMO",
    layout: "SPLIT",
    pages: JSON.stringify(["offer-after-itinerary"]),
    kicker: "Local transport",
    title: "Pahalgam & Sonamarg sightseeing by union cab",
    subtitle: "Booked for you, before you arrive",
    body: "Aru, Betaab Valley and Chandanwari in Pahalgam, and Thajiwas Glacier / Zero Point in Sonamarg, are reached by local union taxis. Add them to your plan and we'll arrange them.",
    features: JSON.stringify([
      { icon: "car", title: "ABC Union", text: "Aru, Betaab & Chandanwari" },
      { icon: "mountain", title: "Sonamarg Union", text: "Thajiwas & Zero Point" },
      { icon: "calendar", title: "Pre-booked", text: "No waiting on the day" },
    ]),
    ctaLabel: "Add Union Cabs",
    ctaUrl: "/plan-your-kashmir-trip#trip-planner-form",
    imageUrl: "/hero/pahalgam-lg.webp",
    imageMobileUrl: "/hero/pahalgam.webp",
  },
];

async function main() {
  const dbName = new URL(process.env.DATABASE_URL ?? "postgres://x/unknown").pathname.slice(1);
  console.log(`Database: ${dbName}`);

  for (const offer of OFFERS) {
    const existing = await prisma.occasionOffer.findUnique({
      where: { slug: offer.slug },
      select: { id: true },
    });
    if (existing) {
      console.log(`  skip    /offers/${offer.slug} (already exists)`);
      continue;
    }
    await prisma.occasionOffer.create({ data: { ...offer, published: false } });
    console.log(`  created /offers/${offer.slug} (unpublished)`);
  }

  for (const banner of OFFER_BANNERS) {
    const slot = JSON.parse(banner.pages as string)[0] as string;
    const existing = await prisma.banner.findFirst({
      where: { pages: { contains: `"${slot}"` } },
      select: { id: true },
    });
    if (existing) {
      console.log(`  skip    banner for ${slot} (slot already has one)`);
      continue;
    }
    await prisma.banner.create({ data: banner });
    console.log(`  created banner for ${slot}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
