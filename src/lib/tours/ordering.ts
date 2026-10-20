import type { TourCategory } from "@prisma/client";

// Every rated Kashmir tour is bestseller=true / rating 5, so bestseller + rating
// alone leave the order to the DB. Categories listed here come first, in this
// order; anything else follows, then title, so card order is deterministic.
const CARD_CATEGORY_ORDER: TourCategory[] = ["HONEYMOON", "FAMILY", "PREMIUM", "GROUP"];

const categoryRank = (c: TourCategory) => {
  const i = CARD_CATEGORY_ORDER.indexOf(c);
  return i === -1 ? CARD_CATEGORY_ORDER.length : i;
};

/** Sort comparator: bestseller → rating → CARD_CATEGORY_ORDER → title. */
export const compareToursForCards = (
  a: { bestseller: boolean; rating: number; category: TourCategory; title: string },
  b: { bestseller: boolean; rating: number; category: TourCategory; title: string },
) =>
  Number(b.bestseller) - Number(a.bestseller) ||
  b.rating - a.rating ||
  categoryRank(a.category) - categoryRank(b.category) ||
  a.title.localeCompare(b.title);

  