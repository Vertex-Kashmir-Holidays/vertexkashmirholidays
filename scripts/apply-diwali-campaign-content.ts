// Campaign content for the Diwali 2026 offer (/offers/diwali-kashmir-tour-package-2026):
// SEO title/description, hero, overview, "why this offer", day-by-day text,
// inclusions/exclusions, FAQs and per-package copy. Written around the search
// terms people actually use — "diwali kashmir tour package", "kashmir diwali
// package", "kashmir tour package 5 nights 6 days price", "kashmir tour
// package for couple / family", "kashmir in november (weather / snow)",
// "diwali tour packages from ahmedabad / surat / mumbai".
//
// Facts confirmed by the business (2026-09-27): breakfast + dinner on every
// package; private sedan for Comfort/3-Star, Innova Crysta for 4-Star/5-Star;
// flights excluded. Snow is never promised — early November is autumn
// (chinar) season, with snow possible only on the upper slopes.
//
// Updates the existing offer in place (run after scripts/seed-occasion-offers.ts
// on a fresh database). Prices are read from the database, never hardcoded.
// Everything stays editable in Admin → Offers afterwards. Safe to re-run —
// it overwrites these fields with the text below.
//
//   npx tsx scripts/apply-diwali-campaign-content.ts
import { prisma } from "../src/lib/prisma";
import { syncOfferCrmTour } from "../src/lib/offers/crmTour";
import type { OfferFaq, OfferItineraryDay, OfferPoint } from "../src/lib/offers/content";

const SLUG = "diwali-kashmir-tour-package-2026";
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// Same order as the seeded route: Srinagar → Pahalgam ×2 → Gulmarg → Sonamarg → departure.
const DAYS: Omit<OfferItineraryDay, "image">[] = [
  {
    destination: "srinagar",
    title: "Arrive in Srinagar — Dal Lake & Mughal Gardens",
    description:
      "Your driver meets you at Srinagar airport on Dhanteras. After check-in, visit the Nishat and Shalimar Mughal Gardens, golden with autumn chinars, and end the day with a sunset Shikara ride on Dal Lake.",
    highlights: ["Srinagar airport pickup", "Nishat & Shalimar Bagh", "Sunset Shikara ride on Dal Lake"],
  },
  {
    destination: "pahalgam",
    title: "Srinagar to Pahalgam — Saffron Fields & Lidder Valley",
    description:
      "Drive past the saffron fields of Pampore and the 9th-century Awantipora ruins to Pahalgam, the Valley of Shepherds. Walk along the Lidder River as the mountain air turns crisp.",
    highlights: ["Pampore saffron fields", "Awantipora temple ruins", "Lidder riverside walk"],
  },
  {
    destination: "pahalgam",
    title: "Diwali in Pahalgam — Aru, Betaab & Chandanwari",
    description:
      "Spend Diwali day in the mountains. Explore Betaab Valley, Aru Valley and Chandanwari by local union cab (included on 4-Star and 5-Star), then celebrate Diwali evening back at your hotel.",
    highlights: ["Betaab Valley", "Aru Valley meadows", "Chandanwari"],
  },
  {
    destination: "gulmarg",
    title: "Pahalgam to Gulmarg — Gondola & Meadow of Flowers",
    description:
      "Cross the valley to Gulmarg. Ride the Gulmarg Gondola (included from 3-Star) for sweeping Himalayan views — early-season snow is possible on the upper slopes in November — and stroll the meadow to St. Mary's Church.",
    highlights: ["Gulmarg Gondola ride", "Himalayan views from Kongdoori", "Gulmarg meadow & St. Mary's Church"],
  },
  {
    destination: "sonamarg",
    title: "Sonamarg Day Trip & Dal Lake Houseboat Night",
    description:
      "Follow the Sindh River to Sonamarg, the Meadow of Gold, with views of the Thajiwas Glacier. Return to Srinagar for your last night aboard a traditional Dal Lake houseboat.",
    highlights: ["Sindh River valley drive", "Thajiwas Glacier views", "Night on a Dal Lake houseboat"],
  },
  {
    destination: "srinagar",
    title: "Departure — Fly Home from Srinagar",
    description:
      "Breakfast on the houseboat, a short Shikara to the shore and your transfer to Srinagar airport — with time for saffron, walnuts and pashmina shopping on the way if your flight allows.",
    highlights: ["Breakfast on the houseboat", "Srinagar airport drop", "Saffron & dry-fruit shopping"],
  },
];

const WHY: OfferPoint[] = [
  {
    title: "The whole Diwali week in Kashmir",
    text: "6–11 November covers all five days of the festival — Dhanteras to Bhai Dooj — and fits neatly into Diwali vacation.",
  },
  {
    title: "Golden chinar season",
    text: "Early November is Kashmir's autumn peak: chinar trees turn gold and red around Dal Lake and the Mughal Gardens, under clear, crisp skies.",
  },
  {
    title: "One clear price for two",
    text: "Every price on this page is the total for 2 adults, with breakfast and dinner daily and a private vehicle. What's included is listed plainly below.",
  },
  {
    title: "A night on Dal Lake",
    text: "Every package includes a night on a traditional houseboat and a Shikara ride — the classic Srinagar experience.",
  },
  {
    title: "Four valleys, one trip",
    text: "Srinagar, Pahalgam, Gulmarg and Sonamarg in 5 nights, on a route planned so you're never rushed.",
  },
  {
    title: "A Kashmir-based team",
    text: "We're a local company from Baramulla. Our team is on call throughout your trip and adjusts plans for weather and road conditions.",
  },
];

const INCLUSIONS = [
  "5 nights' stay as per your package (twin sharing), including 1 night on a Dal Lake houseboat",
  "Daily breakfast and dinner (MAP) — 5 breakfasts and 5 dinners",
  "Private vehicle for Srinagar airport pickup and drop and all sightseeing as per itinerary — sedan on Comfort and 3-Star, Innova Crysta on 4-Star and 5-Star",
  "Shikara ride on Dal Lake",
  "Gulmarg Gondola ride — 3-Star, 4-Star and 5-Star packages",
  "Local union cab for Aru, Betaab and Chandanwari in Pahalgam — 4-Star and 5-Star packages",
  "Sonamarg union vehicle to Thajiwas — 5-Star package",
  "Support from our Kashmir-based team throughout the trip",
];

const EXCLUSIONS = [
  "Flights or train to and from Srinagar",
  "Lunch, and any meals not listed above",
  "Activities and local union cabs not included in your package (see Compare Packages) — can be added on request",
  "Pony rides, entry tickets, snow gear and other optional activities",
  "Personal expenses such as laundry, phone calls and tips",
  "Anything not listed under inclusions",
];

const faqs = (from: number): OfferFaq[] => [
  {
    question: "When is Diwali 2026, and which dates does this package cover?",
    answer:
      "Diwali (Lakshmi Puja) is on Sunday, 8 November 2026. This package runs from Friday 6 November (Dhanteras) to Wednesday 11 November — 5 nights and 6 days that cover the whole festival, including Bhai Dooj on the 10th.",
  },
  {
    question: "What is the price of the Diwali Kashmir tour package?",
    answer: `Packages start at ${inr(from)} for 2 adults (${inr(Math.round(from / 2))} per person on twin sharing) for 5 nights and 6 days. Every price shown is the total for two adults, with breakfast and dinner daily and a private vehicle. Compare the Comfort, 3-Star, 4-Star and 5-Star packages above.`,
  },
  {
    question: "Will there be snow in Kashmir in early November?",
    answer:
      "Early November is Kashmir's autumn season, famous for golden chinar trees. Snow is possible on Gulmarg's upper slopes and at higher points around Sonamarg, but it can't be guaranteed this early. Heavier snow usually arrives from late November and December.",
  },
  {
    question: "What is the weather like in Kashmir in November, and what should I pack?",
    answer:
      "Days are cool and usually sunny; nights get cold, often close to freezing in Gulmarg and Pahalgam. Pack warm layers, a heavy jacket, a cap, gloves and comfortable walking shoes.",
  },
  {
    question: "Are flights included?",
    answer:
      "No — this is a land package that starts and ends at Srinagar airport. Fly in from Ahmedabad, Surat, Mumbai, Delhi, Bengaluru or any other city; we're happy to suggest flights that match the itinerary.",
  },
  {
    question: "Which meals are included?",
    answer:
      "Breakfast and dinner every day (MAP) on every package — 5 breakfasts and 5 dinners. Lunch is on your own, so you can try local food along the way.",
  },
  {
    question: "Which vehicle will we travel in?",
    answer:
      "A private sedan on the Comfort and 3-Star packages, and a private Innova Crysta on the 4-Star and 5-Star packages — for your airport transfers and all sightseeing. An Innova upgrade on the other packages is available on request.",
  },
  {
    question: "Is this package suitable for couples and families?",
    answer:
      "Yes. Prices are for 2 adults sharing a room, which suits couples. Travelling with children or more adults? Tell us in the enquiry and we'll quote extra beds and additional rooms.",
  },
  {
    question: "Can I change the dates or customise the trip?",
    answer:
      "Yes. The dates are set around Diwali, but we can shift or extend them, change hotels, or add and remove activities. We'll share the revised price before you book.",
  },
  {
    question: "Is Kashmir open for tourists in November?",
    answer:
      "Yes. Srinagar, Pahalgam, Gulmarg and Sonamarg are Kashmir's main tourist circuits and welcome visitors through November. Our local team stays in touch throughout and adjusts plans for weather or road conditions.",
  },
];

const PACKAGES: Record<
  string,
  { description: string; badge: string; mealPlan: string; vehicle: string; highlights: string[] }
> = {
  Comfort: {
    description:
      "The best-priced way to spend Diwali in Kashmir — comfortable Srinagar hotels, day trips to every valley and a night on a Dal Lake houseboat.",
    badge: "",
    mealPlan: "Breakfast + Dinner",
    vehicle: "Private sedan",
    highlights: [
      "Day trips to Pahalgam, Gulmarg & Sonamarg",
      "Shikara ride on Dal Lake",
      "Houseboat night on Dal Lake",
    ],
  },
  "3-Star": {
    description:
      "3-Star hotels with a night in Pahalgam by the Lidder River, the Gulmarg Gondola and a Dal Lake houseboat night.",
    badge: "Best Value",
    mealPlan: "Breakfast + Dinner",
    vehicle: "Private sedan",
    highlights: ["Night in Pahalgam", "Gulmarg Gondola ride", "Shikara ride + houseboat night"],
  },
  "4-Star": {
    description:
      "Stay in all four places — Srinagar, Pahalgam, Gulmarg and a Dal Lake houseboat — in 4-Star hotels, travelling by Innova Crysta.",
    badge: "",
    mealPlan: "Breakfast + Dinner",
    vehicle: "Innova Crysta",
    highlights: [
      "Nights in Pahalgam and Gulmarg",
      "Aru, Betaab & Chandanwari by union cab",
      "Gulmarg Gondola + Shikara ride",
    ],
  },
  "5-Star": {
    description:
      "Kashmir's finest stays for the festival — 5-Star hotels in Srinagar, Pahalgam and Gulmarg, a houseboat night and every local transfer covered.",
    badge: "",
    mealPlan: "Breakfast + Dinner",
    vehicle: "Innova Crysta",
    highlights: [
      "5-Star hotels across the route",
      "Sonamarg union vehicle to Thajiwas",
      "Gondola, Shikara & Pahalgam union cab",
    ],
  },
};

async function main() {
  const dbName = new URL(process.env.DATABASE_URL ?? "").pathname.slice(1);
  console.log(`Database: ${dbName}`);

  const offer = await prisma.occasionOffer.findUnique({
    where: { slug: SLUG },
    select: { id: true, itinerary: true, packages: { select: { id: true, name: true, priceForTwo: true } } },
  });
  if (!offer) throw new Error(`Offer /offers/${SLUG} not found — run scripts/seed-occasion-offers.ts first.`);

  const from = Math.min(...offer.packages.map((p) => p.priceForTwo));
  // Keep any day photo already set in admin.
  const current = JSON.parse(offer.itinerary) as OfferItineraryDay[];
  const itinerary = DAYS.map((d, i) => ({ ...d, image: current[i]?.image ?? "" }));

  await prisma.occasionOffer.update({
    where: { id: offer.id },
    data: {
      // buildMetadata caps <title> at 34 chars before " | Vertex Kashmir Holidays" —
      // the price lives in the description instead.
      metaTitle: "Diwali Kashmir Tour Package 2026",
      metaDesc: `Diwali 2026 in Kashmir, 6–11 Nov: 5N/6D Srinagar, Pahalgam, Gulmarg & Sonamarg + Dal Lake houseboat. Breakfast & dinner, private cab. From ${inr(from)} for 2.`,
      ogTitle: `Diwali in Kashmir 2026 — 5 Nights from ${inr(from)} for 2`,
      ogDesc:
        "Spend the whole Diwali week among golden chinars — Srinagar, Pahalgam, Gulmarg, Sonamarg and a Dal Lake houseboat night.",
      heroTitle: "Diwali Kashmir Tour Package 2026",
      heroSubtitle:
        "Spend the whole Diwali week — Dhanteras to Bhai Dooj — among golden chinars in Srinagar, Pahalgam, Gulmarg and Sonamarg, with a night on a Dal Lake houseboat.",
      shortDescription: `A 5 Nights / 6 Days Kashmir tour package for Diwali 2026 (6–11 November): Srinagar, Pahalgam, Gulmarg and Sonamarg with a Dal Lake houseboat night, daily breakfast and dinner and a private vehicle — from ${inr(from)} for 2 adults.`,
      overview: [
        "<h3>Why spend Diwali in Kashmir?</h3>",
        "<p>Diwali holidays land in Kashmir's most photogenic season. In early November the chinar trees around Dal Lake and the Mughal Gardens turn gold and crimson, the skies are clear and the crowds of summer are gone. This fixed-date package covers the whole festival — Dhanteras on 6 November to Bhai Dooj on 10 November — so you celebrate Diwali in the mountains and fly home on the 11th.</p>",
        "<h3>Kashmir in November: weather and snow</h3>",
        "<p>Expect cool, sunny days and cold nights, close to freezing in Gulmarg and Pahalgam. Early-season snow is possible on Gulmarg's upper slopes, but it isn't guaranteed this early in November — the real draw is autumn colour, crisp air and quiet valleys.</p>",
        "<h3>Travelling from Ahmedabad, Surat, Mumbai or Delhi?</h3>",
        "<p>This is a land package from Srinagar airport, so you can fly in from any city. Book your flights to arrive on 6 November and leave on 11 November — or tell us your city and we'll suggest suitable flights. Couples, families and groups are welcome; prices shown are for 2 adults sharing a room.</p>",
      ].join(""),
      whyThisOffer: JSON.stringify(WHY),
      itinerary: JSON.stringify(itinerary),
      inclusions: JSON.stringify(INCLUSIONS),
      exclusions: JSON.stringify(EXCLUSIONS),
      faqs: JSON.stringify(faqs(from)),
    },
  });

  for (const pkg of offer.packages) {
    const copy = PACKAGES[pkg.name];
    if (!copy) {
      console.log(`  skip package "${pkg.name}" (no copy for it)`);
      continue;
    }
    await prisma.occasionOfferPackage.update({
      where: { id: pkg.id },
      data: {
        description: copy.description,
        badge: copy.badge || null,
        mealPlan: copy.mealPlan,
        vehicle: copy.vehicle,
        highlights: JSON.stringify(copy.highlights),
      },
    });
  }

  // Meals/vehicle feed the hidden CRM tour's package options.
  await syncOfferCrmTour(offer.id);
  console.log(`  updated /offers/${SLUG} (from ${inr(from)}) and its ${offer.packages.length} packages`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
