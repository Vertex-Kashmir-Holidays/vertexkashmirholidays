"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TourCard } from "@/components/ui/organisms/TourCard";
import { PriceRangeSlider } from "@/components/ui/molecules/PriceRangeSlider";
import { TOUR_SORT_LABELS } from "@/components/tours/ToursGridSection";
import { PromoBannerCard, type PromoBannerData } from "@/components/public/PromoBanner";
import { EASE_BRAND } from "@/lib/motion";
import type { TourSortOption } from "@/types/tours";

type CardData = React.ComponentProps<typeof TourCard>["tour"];

export interface TourCollectionGridItem {
  card: CardData;
  /** Per-person price — same basis as the /tours price filter and sort. */
  priceFrom: number;
  rating: number;
}

// Same step as the /tours price slider.
const PRICE_STEP = 1000;
// The mid-grid promo slot sits after this many cards.
const MID_BANNER_AFTER = 6;

// Admin-managed PROMO banners (Admin → Banners), rendered with the site's
// standard PromoBannerCard. Nothing renders when no banner targets the slot.
function BannerSlot({ banners }: { banners: PromoBannerData[] }) {
  if (banners.length === 0) return null;
  return (
    <div className="my-10 space-y-6">
      {banners.map((b) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: EASE_BRAND }}
        >
          <PromoBannerCard banner={b} />
        </motion.div>
      ))}
    </div>
  );
}

// Tour grid on a Tour Collection page, with a price-range slider (left) and a
// sort dropdown (right) above it. Client-side only: the server already sends
// every published tour in the collection, in "Popular" order.
export function TourCollectionGrid({
  title,
  items,
  midBanners = [],
  endBanners = [],
}: {
  title: string;
  items: TourCollectionGridItem[];
  /** "tour-collection-after-6" banners — shown after the 6th visible card. */
  midBanners?: PromoBannerData[];
  /** "tour-collection-after-all" banners — shown after the last card. */
  endBanners?: PromoBannerData[];
}) {
  const [sort, setSort] = useState<TourSortOption>("popular");
  // null = full range; a tuple once the visitor narrows it.
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  const bounds = useMemo(() => {
    const prices = items.map((i) => i.priceFrom);
    return {
      min: Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP,
      max: Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP,
    };
  }, [items]);
  const range = useMemo<[number, number]>(
    () => priceRange ?? [bounds.min, bounds.max],
    [priceRange, bounds],
  );

  const shown = useMemo(() => {
    const [lo, hi] = range;
    const result = items.filter((i) => i.priceFrom >= lo && i.priceFrom <= hi);
    // "popular" keeps the server order (bestseller, then rating)
    if (sort === "price-asc") result.sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === "price-desc") result.sort((a, b) => b.priceFrom - a.priceFrom);
    if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [items, range, sort]);

  // Filtering/sorting one or two tours adds nothing — hide the toolbar.
  const showToolbar = items.length > 2;
  const hasPriceSpread = bounds.max > bounds.min;

  return (
    <section>
      <h2 className="text-[20px] font-bold">{title}</h2>

      {showToolbar && (
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-end sm:justify-between sm:p-5">
          {hasPriceSpread ? (
            <div className="w-full sm:max-w-sm">
              <p className="text-[14px] font-bold">
                Price Range{" "}
                <span className="text-[12px] font-medium text-muted-foreground">(per person)</span>
              </p>
              <PriceRangeSlider
                min={bounds.min}
                max={bounds.max}
                step={PRICE_STEP}
                value={range}
                onChange={setPriceRange}
              />
            </div>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2.5 text-[14px] sm:pb-1">
            <label htmlFor="collection-sort" className="text-muted-foreground">
              Sort by:
            </label>
            <select
              id="collection-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as TourSortOption)}
              className="cursor-pointer appearance-none rounded-lg border border-border bg-card px-3.5 py-2 font-semibold shadow-soft outline-none transition hover:border-primary"
            >
              {Object.entries(TOUR_SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <p className="text-[18px] font-bold">No tours in this price range</p>
          <button
            type="button"
            onClick={() => setPriceRange(null)}
            className="rounded-lg border-[1.5px] border-primary px-5 py-2 text-[14px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            Reset price
          </button>
        </div>
      ) : (
        // Re-keyed on sort/range change so cards re-run their entrance animation.
        <motion.div
          key={`${sort}-${range[0]}-${range[1]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.slice(0, MID_BANNER_AFTER).map((i, idx) => (
              <TourCard key={i.card.detailHref ?? idx} tour={i.card} index={idx} variant="tours" />
            ))}
          </div>
          {/* Mid-grid banner only when more cards follow it — otherwise it
              would sit right next to the end-of-grid banner. */}
          {shown.length > MID_BANNER_AFTER && (
            <>
              <BannerSlot banners={midBanners} />
              <div
                className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${midBanners.length ? "" : "mt-5"}`}
              >
                {shown.slice(MID_BANNER_AFTER).map((i, idx) => (
                  <TourCard
                    key={i.card.detailHref ?? idx}
                    tour={i.card}
                    index={idx}
                    variant="tours"
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      <BannerSlot banners={endBanners} />
    </section>
  );
}
