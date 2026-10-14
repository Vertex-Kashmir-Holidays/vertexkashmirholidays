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

/** Adventure.tiers (JSON string) → tiers; anything unparseable is no tiers. */
export function parseAdventureTiers(raw: string | null | undefined): AdventureTier[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? (v as AdventureTier[]) : [];
  } catch {
    return [];
  }
}
