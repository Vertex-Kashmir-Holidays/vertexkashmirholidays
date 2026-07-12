'use client';

import { TourCard } from '@/components/ui/TourCard';
import { formatINR } from '@/lib/accents';
import { motion } from 'framer-motion';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TourListItemData, TourSortOption } from '@/types/tours';

interface ToursGridSectionProps {
  tours: TourListItemData[];
  totalCount: number;
  sort: TourSortOption;
  onSortChange: (sort: TourSortOption) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onFilterToggle?: () => void;
  onClearFilters?: () => void;
}

const badgeColors = ['orange', 'blue', 'green'] as const;

const sortLabels: Record<TourSortOption, string> = {
  popular: 'Popular',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  rating: 'Highest Rated',
};

export function ToursGridSection({
  tours,
  totalCount,
  sort,
  onSortChange,
  page,
  pageCount,
  onPageChange,
  onFilterToggle,
  onClearFilters,
}: ToursGridSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <motion.h2
          className="h-display text-[17px] font-bold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          All Tours <span className="font-sans text-[13px] font-semibold text-primary">({totalCount} {totalCount === 1 ? 'Package' : 'Packages'})</span>
        </motion.h2>

        <div className="flex items-center gap-2.5 text-[13px]">
          {/* Mobile Filter Button */}
          <button
            onClick={onFilterToggle}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 font-semibold shadow-soft lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            <span>Filters</span>
          </button>

        <label htmlFor="tours-sort" className="sr-only sm:not-sr-only sm:text-muted-foreground">Sort by:</label>
          <select
            id="tours-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as TourSortOption)}
            className="cursor-pointer appearance-none rounded-lg border border-border bg-card px-3.5 py-2 font-semibold shadow-soft outline-none transition hover:border-primary"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-[17px] font-bold">No tours match your filters</p>
          <p className="text-[13px] text-muted-foreground">Try removing a filter or searching for something else.</p>
          <button
            onClick={onClearFilters}
            className="rounded-lg border-[1.5px] border-primary px-5 py-2.5 text-[13px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <motion.div
          key={`${page}-${sort}-${totalCount}`}
          className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {tours.map((tour, i) => (
            <TourCard
              key={tour.id}
              tour={{
                badge: tour.badge ?? 'FEATURED',
                bc: badgeColors.includes(tour.badgeColor as (typeof badgeColors)[number])
                  ? (tour.badgeColor as (typeof badgeColors)[number])
                  : 'green',
                image: tour.image ?? undefined,
                detailHref: `/tours/${tour.slug}`,
                bookHref: `/booking?tour=${tour.slug}`,
                t: tour.title,
                d: tour.durationLabel,
                places: tour.places,
                r: tour.rating.toFixed(1),
                n: String(tour.reviewCount),
                old: tour.priceWas ? formatINR(tour.priceWas) : undefined,
                p: formatINR(tour.priceFrom),
              }}
              index={i}
              variant="tours"
            />
          ))}
        </motion.div>
      )}

      {pageCount > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          <motion.button
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
          </motion.button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <motion.button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${
                p === page
                  ? 'bg-primary text-primary-foreground shadow-card'
                  : 'border border-border bg-card text-foreground shadow-soft hover:border-primary hover:text-primary'
              } grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold transition-all duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {p}
            </motion.button>
          ))}
          <motion.button
            aria-label="Next page"
            disabled={page === pageCount}
            onClick={() => onPageChange(page + 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
          </motion.button>
        </nav>
      )}
    </section>
  );
}
