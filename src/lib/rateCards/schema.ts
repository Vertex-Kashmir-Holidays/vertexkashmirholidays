// Domain schema for Season Rate Cards — the internal package-price lookup the
// sales team quotes from. The whole sheet lives in RateCard.data (Json); this
// Zod schema validates it on every write so unvalidated JSON never reaches
// the database. See prisma/schema.prisma -> RateCard for why it's a single
// self-contained snapshot rather than normalised tables.
//
// `minProfit` and each tier's `cost` are INTERNAL: editors use them to check
// margins, and toSalesData() strips them before anything reaches the sales
// view. Never send them to a non-editor.
import { z } from "zod";

const amount = z.number().int().min(0);

export const packageSetSchema = z.object({
  base: amount,
  withActivities: amount,
  withUnionCab: amount,
});
export type PackageSet = z.infer<typeof packageSetSchema>;

export const PACKAGE_COLUMNS = [
  { key: "base", label: "Base" },
  { key: "withActivities", label: "With activities" },
  { key: "withUnionCab", label: "With union cab" },
] as const satisfies readonly { key: keyof PackageSet; label: string }[];

export const rateCardHotelSchema = z.object({
  location: z.string().trim().min(1, "Location is required").max(60),
  name: z.string().trim().min(1, "Hotel name is required").max(120),
  perNight: amount,
  extraBed: amount.nullable(),
  // CNB — child (6–12 yrs) sharing without an extra bed. Defaulted so hotels
  // saved before this column existed still parse as blank.
  childNoBed: amount.nullable().default(null),
  familyRoom: amount.nullable(),
});
export type RateCardHotel = z.infer<typeof rateCardHotelSchema>;

export const rateCardTierSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1, "Tier name is required").max(60),
  order: z.number().int(),
  hotels: z.array(rateCardHotelSchema),
  // B2B / customer prices. Calculated from `cost` (cost + profit + GST, see
  // withCalculatedPrices) whenever the cost is entered; a column with no cost
  // keeps its stored price.
  packages: z.object({ b2b: packageSetSchema, customer: packageSetSchema }),
  // Internal: what the package costs us. 0 = not entered yet. When `stay` is
  // set, cost is CALCULATED by the build-up (see costFromBuildUp) — not typed.
  cost: packageSetSchema,
  // Night split for the basis (e.g. 5N/6D): nights per location. Each night
  // is priced at the tier's lowest listed hotel rate for that location
  // (pricier hotels are upgrades). Empty = cost is entered by hand (legacy).
  stay: z
    .array(z.object({ location: z.string().trim().min(1).max(60), nights: z.number().int().min(0).max(30) }))
    .default([]),
});
export type RateCardTier = z.infer<typeof rateCardTierSchema>;

export const UNION_CAB_VEHICLES = [
  { key: "sedan", label: "Sedan" },
  { key: "suv", label: "SUV" },
  { key: "sumoScorpio", label: "Sumo / Scorpio" },
] as const;

export const rateCardDataSchema = z.object({
  basis: z.object({
    nights: z.number().int().min(0).max(30),
    days: z.number().int().min(0).max(31),
    pax: z.number().int().min(0).max(50),
    note: z.string().trim().max(300).optional(),
  }),
  activitiesIncluded: z.array(z.string().trim().min(1).max(120)),
  unionCabIncluded: z.array(z.string().trim().min(1).max(120)),
  // Internal: the profit added on top of cost for every package (B2B ₹7,000 /
  // customer ₹10,000 by default) — prices are calculated from it. Key kept as
  // `minProfit` so saved cards still parse.
  minProfit: z.object({ b2b: amount, customer: amount }),
  // GST % included in every package price, B2B and customer alike. Defaulted
  // so cards saved before this field existed still parse.
  gstPercent: z.number().int().min(0).max(28).default(5),
  tiers: z.array(rateCardTierSchema),
  // Internal cost build-up shared by every tier: the package cab (from
  // `vehicles`, for basis.days), what the included activities cost us, and the
  // union cab cost added in "With union cab". Defaulted for older cards.
  costBuild: z
    .object({
      vehicle: z.string().trim().max(60).default("Sedan"),
      activities: amount.default(0),
      unionCab: amount.default(0),
    })
    .default({ vehicle: "Sedan", activities: 0, unionCab: 0 }),
  unionCabs: z.array(
    z.object({
      route: z.string().trim().min(1, "Route is required").max(80),
      // A key is left out where that vehicle isn't offered on the route.
      rates: z.object({
        sedan: amount.optional(),
        suv: amount.optional(),
        sumoScorpio: amount.optional(),
      }),
    }),
  ),
  vehicles: z.array(
    z.object({
      name: z.string().trim().min(1, "Vehicle name is required").max(60),
      price: amount, // per day
    }),
  ),
});
export type RateCardData = z.infer<typeof rateCardDataSchema>;

/** GST and profit inside one package price — profit is null until cost is entered. */
export interface PriceBreakdown {
  gst: number;
  profit: number | null;
}
type PackageBreakdown = Record<keyof PackageSet, PriceBreakdown>;

/**
 * The card as the sales view sees it: prices plus the GST and profit each one
 * contains (so sales know the margin they are quoting from), but never the raw
 * cost or the profit settings.
 */
export type RateCardSalesTier = Omit<RateCardTier, "cost"> & {
  breakdown: { b2b: PackageBreakdown; customer: PackageBreakdown };
};
export type RateCardSalesData = Omit<RateCardData, "minProfit" | "tiers"> & {
  tiers: RateCardSalesTier[];
};

export function toSalesData(data: RateCardData): RateCardSalesData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { minProfit, tiers, ...rest } = data;
  const breakdownOf = (tier: RateCardTier, row: "b2b" | "customer"): PackageBreakdown => {
    const out = {} as PackageBreakdown;
    for (const c of PACKAGE_COLUMNS) {
      const price = tier.packages[row][c.key];
      const cost = tier.cost[c.key];
      out[c.key] = {
        gst: gstIn(price, data.gstPercent),
        profit: cost > 0 ? profitOf(price, cost, data.gstPercent) : null,
      };
    }
    return out;
  };
  return {
    ...rest,
    tiers: [...tiers]
      .sort((a, b) => a.order - b.order)
      .map(({ cost, ...tier }) => ({
        ...tier,
        breakdown: { b2b: breakdownOf({ ...tier, cost }, "b2b"), customer: breakdownOf({ ...tier, cost }, "customer") },
      })),
  };
}

/** Card-level fields edited alongside `data`. Dates are "YYYY-MM-DD". */
export const rateCardMetaSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    seasonLabel: z.string().trim().min(1, "Season label is required").max(40),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    notes: z.string().trim().max(2000).nullable(),
  })
  .refine((m) => m.endDate >= m.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
export type RateCardMeta = z.infer<typeof rateCardMetaSchema>;

export const RATE_CARD_STATUS_STYLES: Record<"DRAFT" | "ACTIVE" | "ARCHIVED", string> = {
  DRAFT: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  ARCHIVED: "bg-muted text-muted-foreground",
};

/** Default profit added over cost per package. */
export const DEFAULT_PROFIT = { b2b: 7000, customer: 10000 } as const;

/** GST charged on cost + profit, e.g. 5% of ₹50,000 → ₹2,500. */
export function gstOn(cost: number, profit: number, gstPercent: number): number {
  return Math.round(((cost + profit) * gstPercent) / 100);
}

/** Package price from cost: cost + profit, then GST on top (GST-inclusive price). */
export function priceFromCost(cost: number, profit: number, gstPercent: number): number {
  return cost + profit + gstOn(cost, profit, gstPercent);
}

/** Lowest listed per-night rate for a location in a tier, or null if none listed. */
export function stayRate(tier: RateCardTier, location: string): number | null {
  const rates = tier.hotels
    .filter((h) => h.location.trim().toLowerCase() === location.trim().toLowerCase() && h.perNight > 0)
    .map((h) => h.perNight);
  return rates.length ? Math.min(...rates) : null;
}

export interface CostBreakdown {
  hotels: number;
  cab: number;
  activities: number;
  unionCab: number;
  /** Locations in the night split with no hotel rate listed. */
  missing: string[];
  cost: PackageSet;
}

/**
 * Package cost from the build-up: hotels (nights × lowest rate per location)
 * + cab (vehicle day rate × basis.days) = Base; + activities = With
 * activities; + union cab = With union cab. Null when the tier has no night
 * split (its cost is entered by hand).
 */
export function costFromBuildUp(tier: RateCardTier, data: RateCardData): CostBreakdown | null {
  if (tier.stay.length === 0) return null;
  const missing: string[] = [];
  let hotels = 0;
  for (const s of tier.stay) {
    if (s.nights <= 0) continue;
    const rate = stayRate(tier, s.location);
    if (rate == null) missing.push(s.location);
    else hotels += rate * s.nights;
  }
  const vehicle = data.vehicles.find((v) => v.name.trim().toLowerCase() === data.costBuild.vehicle.trim().toLowerCase());
  const cab = (vehicle?.price ?? 0) * data.basis.days;
  const base = hotels + cab;
  return {
    hotels,
    cab,
    activities: data.costBuild.activities,
    unionCab: data.costBuild.unionCab,
    missing,
    cost: {
      base,
      withActivities: base + data.costBuild.activities,
      withUnionCab: base + data.costBuild.activities + data.costBuild.unionCab,
    },
  };
}

/**
 * Fill every tier's B2B and customer prices from its cost — the single place
 * prices are calculated, used live by the editor and again by the API before
 * saving (authoritative). Columns with no cost (0) keep their stored price.
 */
export function withCalculatedPrices(data: RateCardData): RateCardData {
  const calc = (tier: RateCardTier, row: "b2b" | "customer"): PackageSet => {
    const out = { ...tier.packages[row] };
    for (const c of PACKAGE_COLUMNS) {
      const cost = tier.cost[c.key];
      if (cost > 0) out[c.key] = priceFromCost(cost, data.minProfit[row], data.gstPercent);
    }
    return out;
  };
  return {
    ...data,
    tiers: data.tiers.map((t) => {
      // A tier with a night split gets its cost from the build-up first.
      const built = costFromBuildUp(t, data);
      const tier = built ? { ...t, cost: built.cost } : t;
      return { ...tier, packages: { b2b: calc(tier, "b2b"), customer: calc(tier, "customer") } };
    }),
  };
}

/** GST contained in a GST-inclusive price, e.g. 5% of ₹52,500 → ₹2,500. */
export function gstIn(price: number, gstPercent: number): number {
  return Math.round((price * gstPercent) / (100 + gstPercent));
}

/** What a GST-inclusive price leaves over cost once GST is paid. */
export function profitOf(price: number, cost: number, gstPercent: number): number {
  return price - gstIn(price, gstPercent) - cost;
}

export function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Date column → "YYYY-MM-DD" (dates are stored at UTC midnight). */
export function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}
