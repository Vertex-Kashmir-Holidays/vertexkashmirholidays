// "Auto-fill from Hotel Rates" for an Occasion Offer plan: gives every place
// the plan sleeps in up to 4 hotel options from Hotel Rates, matched by place
// and by the plan's class (Comfort / 3-Star / 4-Star / 5-Star). If a place has
// fewer than 3 hotels in that class (typically houseboats), it tops up with
// the nearest classes — each card still shows the hotel's real class.
// Existing options are kept. Client-safe (pure); the catalog comes from
// src/lib/offers/hotelCatalog.ts.
import type { CatalogHotel } from "@/lib/offers/hotelCatalog";
import { hotelsForStay, type OfferHotel, type OfferStay } from "@/lib/offers/content";

const PER_PLACE = 4;
const MIN_PER_PLACE = 3;

// "Comfort" (or Hotel Rates' "Budget"), "3-Star", "3 Star", "4 star" … → Hotel Rates class rank 0–3.
const CLASS_RANK: Record<string, number> = { comfort: 0, budget: 0, "3star": 1, "4star": 2, "5star": 3 };
const classRank = (label: string) => CLASS_RANK[label.toLowerCase().replace(/[\s-]/g, "")];

export function autoFillHotels(
  planName: string,
  stays: OfferStay[],
  hotels: OfferHotel[],
  catalog: CatalogHotel[],
): { hotels: OfferHotel[]; added: number } {
  const next = [...hotels];
  let added = 0;
  const places = stays.filter(
    (s, i, all) =>
      s.destination &&
      all.findIndex((x) => x.destination === s.destination && x.stayType === s.stayType) === i,
  );

  for (const stay of places) {
    const have = hotelsForStay(stay, next).length;
    if (have >= PER_PLACE) continue;
    const target = classRank(stay.category) ?? classRank(planName) ?? 0;
    const candidates = catalog.filter(
      (c) =>
        c.destination === stay.destination &&
        c.stayType === stay.stayType &&
        !next.some((h) => h.name === c.name && h.destination === c.destination),
    );
    const exact = candidates.filter((c) => c.classRank === target);
    // Nearest class first; on a tie prefer the higher class (an upgrade).
    const nearest = candidates
      .filter((c) => c.classRank !== target)
      .sort(
        (a, b) =>
          Math.abs(a.classRank - target) - Math.abs(b.classRank - target) ||
          b.classRank - a.classRank,
      );
    const picks = exact.slice(0, PER_PLACE - have);
    for (const c of nearest) {
      if (have + picks.length >= MIN_PER_PLACE) break;
      picks.push(c);
    }
    for (const { id: _id, source: _s, classRank: _r, onWebsite: _w, ...hotel } of picks) {
      next.push(hotel);
      added++;
    }
  }
  return { hotels: next, added };
}
