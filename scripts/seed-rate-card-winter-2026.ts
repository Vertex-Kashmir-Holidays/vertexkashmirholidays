// One-off seed: the "Winter 2026–27" (NOV – FEB) rate card, transcribed from
// the season rate sheet. Created as DRAFT; skipped if a card with that name
// already exists. Validated against rateCardDataSchema before writing —
// nothing is written if it fails.
//
// Not in the sheet, prefilled from the earlier B2B rate cards (whose 2-pax
// prices match this sheet exactly) — CHECK before activating:
//   basis 5N/6D for 2 pax, activities = Gondola + Shikara, union cab = ABC only.
// Cost per tier is left at 0 (not entered) — the editor flags it.
//
// Deliberate data decisions (see the task brief):
//   - 4 Star Premium's second block, labelled "b2b" in the sheet, is the
//     customer block (it sits ₹2,000 above b2b like every other tier).
//   - 3 Star Luxury customer "with union cab" is 38,000 exactly as the sheet
//     says (same as b2b) — the editor warns on it; to be decided.
//   - 4 Star Deluxe is only partly legible in the screenshots; the rest of its
//     hotels are added in the editor.
//
// Usage (always name the database explicitly):
//   DATABASE_URL=<url> npx tsx scripts/seed-rate-card-winter-2026.ts

import { PrismaClient } from "@prisma/client";
import { rateCardDataSchema, type RateCardData, type RateCardHotel } from "../src/lib/rateCards/schema";

const prisma = new PrismaClient();

const NAME = "Winter 2026–27";

type HotelRow = [location: string, name: string, perNight: number, extraBed: number | null, familyRoom?: number | null];
const hotels = (rows: HotelRow[]): RateCardHotel[] =>
  rows.map(([location, name, perNight, extraBed, familyRoom = null]) => ({
    location,
    name,
    perNight,
    extraBed,
    familyRoom,
  }));

const pkg = (base: number, withActivities: number, withUnionCab: number) => ({ base, withActivities, withUnionCab });
const NO_COST = pkg(0, 0, 0);

const FOUR_STAR_HOTELS: [string, string][] = [
  ["Srinagar", "Hotel Downtown"],
  ["Srinagar", "Rose Petal"],
  ["Srinagar", "Elaf Residency"],
  ["Srinagar", "Ennco Resort"],
  ["Srinagar", "5 Falcons"],
  ["Pahalgam", "AS Resorts"],
  ["Pahalgam", "The Idyll"],
  ["Pahalgam", "White Water Resort"],
  ["Pahalgam", "Pahalgam Dayz"],
  ["Pahalgam", "Walnut Village Resort"],
  ["Gulmarg", "Apple Tree Resort"],
  ["Gulmarg", "Hotel Zahgeer"],
  ["Gulmarg", "The Medaws"],
  ["Dal Lake", "Shar-i-Kashmir"],
  ["Dal Lake", "Wangnoo"],
];

const data: RateCardData = {
  basis: {
    nights: 5,
    days: 6,
    pax: 2,
    note: "Price is for the whole package for 2 adults sharing one room, inclusive of 5% GST — not per person.",
  },
  activitiesIncluded: ["Gulmarg Gondola ride", "Shikara ride on Dal Lake"],
  unionCabIncluded: ["ABC Union Pahalgam (Aru, Betaab, Chandanwari)"],
  minProfit: { b2b: 5000, customer: 7000 },
  tiers: [
    {
      key: "deluxe",
      label: "Deluxe",
      order: 1,
      hotels: hotels([
        ["Srinagar", "Star of Kashmir", 2000, 800, 3500],
        ["Srinagar", "JF Greens", 2000, 800],
        ["Srinagar", "Barzam", 2000, 800],
        ["Pahalgam", "Blue Whale Resort", 2200, 800],
        ["Pahalgam", "The Classic Crown Pahalgam", 2200, 800],
        ["Pahalgam", "Frozen Leaf", 2000, 800],
        ["Dal Lake", "Olympias", 2500, 800],
      ]),
      packages: { b2b: pkg(25000, 29500, 33000), customer: pkg(27000, 31500, 35000) },
      cost: NO_COST,
    },
    {
      key: "3-star-premium",
      label: "3 Star Premium",
      order: 2,
      hotels: hotels([
        ["Srinagar", "Zaman", 2500, 1000],
        ["Srinagar", "Sideeq Palace", 2500, 1000],
        ["Srinagar", "Harco Inn", 2500, 1000],
        ["Srinagar", "Crown Prince", 2500, 1000],
        ["Srinagar", "The Karims", 2500, 1000],
        ["Pahalgam", "Blue Whale Resort", 2500, 1000],
        ["Pahalgam", "Labiba Resorts", 2500, 1000],
        ["Pahalgam", "Frozen Leaf", 2500, 1000],
        ["Dal Lake", "Olympias", 2500, 1000],
      ]),
      packages: { b2b: pkg(28500, 33000, 36000), customer: pkg(30500, 35000, 38000) },
      cost: NO_COST,
    },
    {
      key: "3-star-luxury",
      label: "3 Star Luxury",
      order: 3,
      hotels: hotels(
        (
          [
            ["Srinagar", "Kareem Residency"],
            ["Srinagar", "Sideeq Palace"],
            ["Srinagar", "Olive Grove Inn"],
            ["Srinagar", "Hotel Royal Heritage"],
            ["Srinagar", "The Karims"],
            ["Pahalgam", "AS Resorts"],
            ["Pahalgam", "Lavida Resort"],
            ["Pahalgam", "The Lidder Resorts"],
            ["Dal Lake", "Olympias"],
          ] as [string, string][]
        ).map(([location, name]): HotelRow => [location, name, 3000, 1000]),
      ),
      packages: { b2b: pkg(31000, 35000, 38000), customer: pkg(33000, 37000, 38000) },
      cost: NO_COST,
    },
    {
      key: "4-star-deluxe",
      label: "4 Star Deluxe",
      order: 4,
      hotels: hotels([
        ["Srinagar", "Kareem Residency", 4500, 1500],
        ["Gulmarg", "Hotel Zangeer", 6000, 2000],
        ["Gulmarg", "The Medaws", 5000, 1500],
        ["Dal Lake", "Shar-i-Kashmir", 5000, 1500],
      ]),
      packages: { b2b: pkg(39000, 44000, 47500), customer: pkg(41000, 46000, 49500) },
      cost: NO_COST,
    },
    {
      key: "4-star-premium",
      label: "4 Star Premium",
      order: 5,
      hotels: hotels(
        FOUR_STAR_HOTELS.map(([location, name]): HotelRow => [
          location,
          name,
          name === "Shar-i-Kashmir" ? 5000 : name === "Wangnoo" ? 6500 : 6000,
          2000,
        ]),
      ),
      packages: { b2b: pkg(47000, 51000, 55000), customer: pkg(49000, 53000, 57000) },
      cost: NO_COST,
    },
    {
      key: "4-star-luxury",
      label: "4 Star Luxury",
      order: 6,
      hotels: hotels(FOUR_STAR_HOTELS.map(([location, name]): HotelRow => [location, name, 10000, 3500])),
      packages: { b2b: pkg(68000, 72000, 76000), customer: pkg(70000, 74000, 78000) },
      cost: NO_COST,
    },
  ],
  unionCabs: [
    { route: "ABC Union Pahalgam", rates: { sedan: 3500, suv: 5000 } },
    { route: "Sonamarg", rates: { sumoScorpio: 5000 } },
    { route: "Tangmarg Chained", rates: { suv: 3000 } },
    { route: "Drung", rates: { suv: 1000 } },
  ],
  vehicles: [
    { name: "Sedan", price: 2000 },
    { name: "Ertiga", price: 2500 },
    { name: "Innova", price: 3000 },
    { name: "Innova Crysta", price: 3500 },
    { name: "Tempo (12)", price: 4500 },
    { name: "Tempo (17)", price: 6000 },
    { name: "Urbania", price: 10000 },
  ],
};

async function main() {
  const parsed = rateCardDataSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Seed data failed validation — nothing written:");
    for (const issue of parsed.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    process.exit(1);
  }

  const existing = await prisma.rateCard.findFirst({ where: { name: NAME }, select: { id: true } });
  if (existing) {
    console.log(`"${NAME}" already exists (${existing.id}) — skipped.`);
    return;
  }

  const card = await prisma.rateCard.create({
    data: {
      name: NAME,
      seasonLabel: "NOV – FEB",
      startDate: new Date("2026-11-01T00:00:00.000Z"),
      endDate: new Date("2027-02-28T00:00:00.000Z"),
      status: "DRAFT",
      data: parsed.data,
    },
    select: { id: true },
  });
  console.log(`Created "${NAME}" as DRAFT (${card.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
