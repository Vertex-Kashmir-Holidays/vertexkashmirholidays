import type { ActivityPriceUnit } from "@prisma/client";

// What an Activity's `price` is charged per (Activity.priceUnit) — shown after
// the price on activity cards and the detail page's quick facts. Client-safe:
// only the enum's type is imported.
export const PRICE_UNIT_LABELS: Record<ActivityPriceUnit, string> = {
  PER_PERSON: "per person",
  PER_BOAT: "per boat",
  PER_VEHICLE: "per vehicle",
  PER_HOUR: "per hour",
  PER_GROUP: "per group",
};

export const PRICE_UNITS = Object.keys(PRICE_UNIT_LABELS) as [
  ActivityPriceUnit,
  ...ActivityPriceUnit[],
];
