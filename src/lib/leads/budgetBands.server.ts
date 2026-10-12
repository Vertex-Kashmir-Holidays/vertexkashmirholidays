import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { UNDECIDED, isValidTravelMonth, type BudgetBandOption } from "@/lib/leads/qualification";

/** Revalidated by the admin budget-band routes. */
export const BUDGET_BANDS_TAG = "budget-bands";

/** Active bands, in display order — what the site's chips show. */
export const getActiveBudgetBands = unstable_cache(
  async (): Promise<BudgetBandOption[]> =>
    prisma.budgetBand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { minAmount: "asc" }],
      select: { key: true, label: true, minAmount: true, maxAmount: true },
    }),
  ["active-budget-bands"],
  { revalidate: 3600, tags: [BUDGET_BANDS_TAG] },
);

export interface ResolvedQualification {
  budgetBandKey: string | null;
  budgetBandLabel: string | null;
  travelMonth: string | null;
}

/**
 * Validates submitted answers into what gets stored. The label is always the
 * band's current label from the DB (never client text) — a snapshot, so later
 * re-pricing doesn't rewrite this lead. An unknown/inactive band or an
 * out-of-window month comes back null.
 */
export async function resolveQualification(input: {
  budgetBandKey?: string | null;
  travelMonth?: string | null;
}): Promise<ResolvedQualification> {
  let budgetBandKey: string | null = null;
  let budgetBandLabel: string | null = null;
  if (input.budgetBandKey === UNDECIDED) {
    budgetBandKey = UNDECIDED;
    budgetBandLabel = "Not sure yet";
  } else if (input.budgetBandKey) {
    const band = await prisma.budgetBand.findFirst({
      where: { key: input.budgetBandKey, isActive: true },
      select: { key: true, label: true },
    });
    if (band) {
      budgetBandKey = band.key;
      budgetBandLabel = band.label;
    }
  }
  const travelMonth =
    input.travelMonth && isValidTravelMonth(input.travelMonth) ? input.travelMonth : null;
  return { budgetBandKey, budgetBandLabel, travelMonth };
}

/**
 * Tour context: the active band a price per person falls in (a tour's
 * priceFrom, or a package option's price for 2 ÷ 2) — stored like a chosen
 * band, with budgetBandDerived = true. Null when no band covers the price.
 */
export async function deriveBandForPrice(
  pricePerPerson: number,
): Promise<{ budgetBandKey: string; budgetBandLabel: string } | null> {
  const band = await prisma.budgetBand.findFirst({
    where: {
      isActive: true,
      minAmount: { lte: pricePerPerson },
      OR: [{ maxAmount: null }, { maxAmount: { gte: pricePerPerson } }],
    },
    orderBy: { minAmount: "desc" },
    select: { key: true, label: true },
  });
  return band ? { budgetBandKey: band.key, budgetBandLabel: band.label } : null;
}
