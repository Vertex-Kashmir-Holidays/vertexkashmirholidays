// Adventure pricing tiers — shared by the public pricing cards and the lead
// route, so the tier name a "Choose" button sends is checked server-side
// against exactly the names the page can produce. No server-only imports.

import type { AdventureTier } from "@/types/adventure";

export interface AdventureTierChoice {
  /** Stored on Lead.packageName — "7 Days" or "7 Days — 2-sharing". */
  name: string;
  /** Price-row label ("3-sharing"); empty for a single-price tier. */
  label: string;
  price: string;
  old?: string;
}

/** A tier's price rows: one for a plain tier, two when it has a second price. */
export function adventureTierChoices(tier: AdventureTier): AdventureTierChoice[] {
  if (!tier.price2) {
    return [{ name: tier.name, label: tier.priceLabel ?? "", price: tier.price, old: tier.old }];
  }
  const rows = [
    { label: tier.priceLabel || "Option 1", price: tier.price, old: tier.old },
    { label: tier.price2Label || "Option 2", price: tier.price2, old: tier.old2 },
  ];
  return rows.map((r) => ({ ...r, name: `${tier.name} — ${r.label}` }));
}

const toAmount = (price: string | null | undefined): number | null => {
  const digits = (price ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
};
const TWO_SHARING = /\b2[\s-]*(sharing|persons?|pax)\b/i;

/**
 * The adventure's "starting from" price, per person. Quoted on the 2-sharing
 * basis — when a tier has a "2-sharing" price row that's its starting price
 * (not the cheaper 3-sharing one), otherwise its only price — and the
 * adventure starts from the cheapest tier. Used by the listing card, the EMI
 * widget and anything else that states a single "from" figure.
 */
export function adventureStartingPrice(tiers: AdventureTier[]): {
  price: number | null;
  old: number | null;
} {
  let best: { price: number; old: number | null } | null = null;
  for (const t of tiers) {
    const useSecond = !!t.price2 && TWO_SHARING.test(t.price2Label ?? "");
    const price = toAmount(useSecond ? t.price2 : t.price);
    if (price == null) continue;
    if (!best || price < best.price) {
      best = { price, old: toAmount(useSecond ? t.old2 : t.old) };
    }
  }
  return best ?? { price: null, old: null };
}

/** Adventure.tiers (JSON string) → tiers; anything unparseable is no tiers. */
export function parseAdventureTiers(raw: string | null | undefined): AdventureTier[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? (v as AdventureTier[]) : [];
  } catch {
    return [];
  }
}
