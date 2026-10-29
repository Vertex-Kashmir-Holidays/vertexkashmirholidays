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
  familyRoom: amount.nullable(),
});
export type RateCardHotel = z.infer<typeof rateCardHotelSchema>;

export const rateCardTierSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1, "Tier name is required").max(60),
  order: z.number().int(),
  hotels: z.array(rateCardHotelSchema),
  packages: z.object({ b2b: packageSetSchema, customer: packageSetSchema }),
  // Internal: what the package costs us. 0 = not entered yet.
  cost: packageSetSchema,
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
  // Internal: the minimum profit every package must leave over its cost.
  minProfit: z.object({ b2b: amount, customer: amount }),
  tiers: z.array(rateCardTierSchema),
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

/** The card as the sales view sees it — no cost, no profit rules. */
export type RateCardSalesTier = Omit<RateCardTier, "cost">;
export type RateCardSalesData = Omit<RateCardData, "minProfit" | "tiers"> & {
  tiers: RateCardSalesTier[];
};

export function toSalesData(data: RateCardData): RateCardSalesData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { minProfit, tiers, ...rest } = data;
  return {
    ...rest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tiers: [...tiers].sort((a, b) => a.order - b.order).map(({ cost, ...tier }) => tier),
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

export function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Date column → "YYYY-MM-DD" (dates are stored at UTC midnight). */
export function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}
