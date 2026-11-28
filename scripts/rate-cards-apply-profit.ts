// One-off: set every rate card's profit to the agreed amounts (B2B ₹7,000 /
// customer ₹10,000 per package) and recalculate all prices from cost
// (cost + profit + GST). Goes through saveRateCardData, so each changed card
// gets a revision snapshot (restorable from the card's Revisions panel) and a
// version bump. Idempotent — a card already matching is skipped.
//
// --derive-cost: fill any package whose cost is not entered (0) with
// cost = current B2B price − ₹5,000 (the old sheet's rule: B2B = cost + ₹5,000),
// decided by the user 2026-11-07. Costs already entered are never touched, so
// a re-run can't derive twice.
//
// --build-up (user, 2026-11-07): cost = hotels (5N split per tier, lowest listed
// rate per location) + Sedan × basis.days + activities (Gondola Ph1+Ph2 ₹840 +
// ₹1,100 pp ×2 + Shikara ₹800 = ₹4,680) + ABC union cab (Sedan ₹3,500). Only
// fills a tier's night split / the card's cost inputs where still empty, so
// edits made in the editor are never overwritten. Supersedes --derive-cost.
//
// Run: DATABASE_URL=<target> npx tsx scripts/rate-cards-apply-profit.ts [--build-up | --derive-cost]
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_PROFIT,
  PACKAGE_COLUMNS,
  withCalculatedPrices,
  type RateCardData,
} from "../src/lib/rateCards/schema";
import { parseRateCardData, saveRateCardData } from "../src/lib/rateCards/server";

const prisma = new PrismaClient();
const DERIVE_COST = process.argv.includes("--derive-cost");
const OLD_SHEET_MARGIN = 5000;
const BUILD_UP = process.argv.includes("--build-up");

// 5N/6D night splits from the Winter 5N6D B2B sheets (houseboat always last).
const SPLIT_3STAR = [
  { location: "Srinagar", nights: 3 },
  { location: "Pahalgam", nights: 1 },
  { location: "Dal Lake", nights: 1 },
];
const SPLIT_4STAR = [
  { location: "Srinagar", nights: 2 },
  { location: "Pahalgam", nights: 1 },
  { location: "Gulmarg", nights: 1 },
  { location: "Dal Lake", nights: 1 },
];
// 4 Star Deluxe lists no Pahalgam hotel, so its Pahalgam night sits in Srinagar.
const SPLIT_4SD = [
  { location: "Srinagar", nights: 3 },
  { location: "Gulmarg", nights: 1 },
  { location: "Dal Lake", nights: 1 },
];
const SPLITS: Record<string, typeof SPLIT_3STAR> = {
  Deluxe: SPLIT_3STAR,
  "3 Star Premium": SPLIT_3STAR,
  "3 Star Luxury": SPLIT_3STAR,
  "4 Star Deluxe": SPLIT_4SD,
  "4 Star Premium": SPLIT_4STAR,
  "4 Star Luxury": SPLIT_4STAR,
};

function applyBuildUp(data: RateCardData): RateCardData {
  const cb = data.costBuild;
  const unset = cb.activities === 0 && cb.unionCab === 0;
  return {
    ...data,
    costBuild: unset ? { vehicle: "Sedan", activities: 4680, unionCab: 3500 } : cb,
    tiers: data.tiers.map((t) => (t.stay.length === 0 && SPLITS[t.label] ? { ...t, stay: SPLITS[t.label] } : t)),
  };
}

function deriveMissingCosts(data: RateCardData): RateCardData {
  return {
    ...data,
    tiers: data.tiers.map((t) => {
      const cost = { ...t.cost };
      for (const c of PACKAGE_COLUMNS) {
        const b2b = t.packages.b2b[c.key];
        if (!(cost[c.key] > 0) && b2b > OLD_SHEET_MARGIN) cost[c.key] = b2b - OLD_SHEET_MARGIN;
      }
      return { ...t, cost };
    }),
  };
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "SUPERADMIN" }, select: { id: true } });
  if (!admin) throw new Error("No SUPERADMIN user to attribute the revision to.");

  const cards = await prisma.rateCard.findMany({ select: { id: true, name: true, status: true, version: true, data: true } });
  for (const card of cards) {
    const data = parseRateCardData(card.data);
    if (!data) {
      console.log(`✗ ${card.name}: data does not parse — skipped, fix it in the editor.`);
      continue;
    }
    const base = BUILD_UP ? applyBuildUp(data) : DERIVE_COST ? deriveMissingCosts(data) : data;
    const next = withCalculatedPrices({ ...base, minProfit: { ...DEFAULT_PROFIT } });
    if (JSON.stringify(next) === JSON.stringify(data)) {
      console.log(`= ${card.name} (${card.status}): already up to date.`);
      continue;
    }
    await prisma.$transaction((tx) =>
      saveRateCardData(tx, {
        id: card.id,
        expectedVersion: card.version,
        data: next,
        changeNote: BUILD_UP
          ? "Cost built up: 5N hotels (lowest rate per location) + Sedan × 6 days + activities ₹4,680 + ABC union cab ₹3,500; profit ₹7,000 / ₹10,000; +5% GST."
          : DERIVE_COST
          ? "Costs filled as old B2B − ₹5,000; profit ₹7,000 B2B / ₹10,000 customer; prices recalculated (+5% GST)."
          : "Profit set to ₹7,000 B2B / ₹10,000 customer; prices recalculated from cost (+5% GST).",
        userId: admin.id,
      }),
    );
    const noCost = next.tiers.flatMap((t) =>
      PACKAGE_COLUMNS.filter((c) => !(t.cost[c.key] > 0)).map((c) => `${t.label} / ${c.label}`),
    );
    console.log(`✓ ${card.name} (${card.status}): updated to v${card.version + 1}.`);
    if (noCost.length) console.log(`   no cost entered (price kept as is): ${noCost.join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
