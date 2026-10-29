// Rate card checks, shared by the editor (live, as you type) and the API
// (authoritative). Warnings never block a save; activation blockers block
// making a card ACTIVE — and saving a card that is already ACTIVE.
import { PACKAGE_COLUMNS, formatInr, type RateCardData } from "./schema";

export interface RateCardWarning {
  tierKey?: string;
  message: string;
}

export function getRateCardWarnings(data: RateCardData): RateCardWarning[] {
  const warnings: RateCardWarning[] = [];
  const { minProfit } = data;

  for (const tier of data.tiers) {
    const w = (message: string) => warnings.push({ tierKey: tier.key, message: `${tier.label}: ${message}` });

    if (tier.hotels.length === 0) w("no hotels listed.");
    for (const hotel of tier.hotels) {
      if (hotel.perNight <= 0) w(`${hotel.name || "a hotel"} has no per-night price.`);
    }

    const costEntered = PACKAGE_COLUMNS.some((c) => tier.cost[c.key] > 0);
    if (!costEntered) w("cost not entered, so profit can't be checked.");

    for (const col of PACKAGE_COLUMNS) {
      const b2b = tier.packages.b2b[col.key];
      const customer = tier.packages.customer[col.key];
      const cost = tier.cost[col.key];
      const label = col.label.toLowerCase();

      if (customer <= b2b) {
        w(`customer ${label} (${formatInr(customer)}) is not above B2B (${formatInr(b2b)}).`);
      }
      if (cost > 0) {
        if (b2b - cost < minProfit.b2b) {
          w(`B2B ${label} leaves ${formatInr(b2b - cost)} profit, below the ${formatInr(minProfit.b2b)} minimum.`);
        }
        if (customer - cost < minProfit.customer) {
          w(
            `customer ${label} leaves ${formatInr(customer - cost)} profit, below the ${formatInr(minProfit.customer)} minimum.`,
          );
        }
      }
    }
  }

  return warnings;
}

/** Reasons the card can't be ACTIVE. Empty array = ready. */
export function getActivationBlockers(data: RateCardData): string[] {
  const blockers: string[] = [];
  if (data.basis.nights < 1) blockers.push("Basis: number of nights is not set.");
  if (data.basis.pax < 1) blockers.push("Basis: number of pax is not set.");
  if (data.activitiesIncluded.length === 0) blockers.push("List what “With activities” includes.");
  if (data.unionCabIncluded.length === 0) blockers.push("List which union routes “With union cab” covers.");
  return blockers;
}
