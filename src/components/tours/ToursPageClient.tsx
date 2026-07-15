'use client';

import { useMemo, useState } from 'react';
import { Heart, Users, Mountain, Crown, type LucideIcon } from 'lucide-react';
import type { TourCategory } from '@prisma/client';
import { ToursFiltersSidebar } from '@/components/tours/ToursFiltersSidebar';
import { ToursGridSection } from '@/components/tours/ToursGridSection';
import { AffordabilityWidget } from '@/components/payments/AffordabilityWidget';
import type { TourListItemData, TourSortOption } from '@/types/tours';

interface ToursPageClientProps {
  tours: TourListItemData[];
  browseCategories: TourCategory[];
}

const CATEGORY_META: Record<string, { label: string; Icon: LucideIcon }> = {
  HONEYMOON: { label: 'Honeymoon', Icon: Heart },
  FAMILY: { label: 'Family', Icon: Users },
  ADVENTURE: { label: 'Adventure', Icon: Mountain },
  LUXURY: { label: 'Luxury', Icon: Crown },
};

const DURATION_BUCKETS = [
  { id: '1-3', label: '1 – 3 Days', min: 1, max: 3 },
  { id: '4-6', label: '4 – 6 Days', min: 4, max: 6 },
  { id: '7-10', label: '7 – 10 Days', min: 7, max: 10 },
  { id: '10+', label: '10+ Days', min: 11, max: Infinity },
];

const PAGE_SIZE = 9;
// Price slider granularity — each drag step moves the handle ₹1000.
const PRICE_STEP = 1000;

const REGION_TABS = [
  { id: 'ALL', label: 'All Tours' },
  { id: 'KASHMIR', label: 'Kashmir' },
  { id: 'LADAKH', label: 'Ladakh' },
] as const;

export function ToursPageClient({ tours, browseCategories }: ToursPageClientProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeRegion, setActiveRegion] = useState<'ALL' | 'KASHMIR' | 'LADAKH'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  // null = "full range"; a tuple means the user has narrowed the price.
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [sort, setSort] = useState<TourSortOption>('popular');
  const [page, setPage] = useState(1);

  const regionFiltered = useMemo(
    () => (activeRegion === 'ALL' ? tours : tours.filter((t) => t.region === activeRegion)),
    [tours, activeRegion],
  );

  const categories = useMemo(
    () =>
      Object.entries(CATEGORY_META).map(([id, meta]) => ({
        id,
        ...meta,
        count: regionFiltered.filter((t) => t.category === id).length,
      })),
    [regionFiltered],
  );

  const durations = useMemo(
    () =>
      DURATION_BUCKETS.map((b) => ({
        id: b.id,
        label: b.label,
        count: regionFiltered.filter((t) => t.durationDays >= b.min && t.durationDays <= b.max).length,
      })),
    [regionFiltered],
  );

  // Slider bounds snapped to the ₹1000 step so the handles land on clean values.
  const priceBounds = useMemo(() => {
    if (regionFiltered.length === 0) return { min: 0, max: 0 };
    const prices = regionFiltered.map((t) => t.priceFrom);
    return {
      min: Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP,
      max: Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP,
    };
  }, [regionFiltered]);

  // Effective range: the user's selection, or the full bounds when untouched.
  const effectiveRange: [number, number] = priceRange ?? [priceBounds.min, priceBounds.max];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const [lo, hi] = priceRange ?? [priceBounds.min, priceBounds.max];
    const result = regionFiltered.filter((t) => {
      const searchMatch =
        !q || t.title.toLowerCase().includes(q) || t.places.toLowerCase().includes(q);
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(t.category);
      const durationMatch =
        selectedDurations.length === 0 ||
        DURATION_BUCKETS.some(
          (b) =>
            selectedDurations.includes(b.id) &&
            t.durationDays >= b.min &&
            t.durationDays <= b.max,
        );
      const priceMatch = t.priceFrom >= lo && t.priceFrom <= hi;
      return searchMatch && categoryMatch && durationMatch && priceMatch;
    });

    // "popular" keeps the server order (bestseller first, then rating)
    if (sort === 'price-asc') result.sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === 'price-desc') result.sort((a, b) => b.priceFrom - a.priceFrom);
    if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [regionFiltered, search, selectedCategories, selectedDurations, sort, priceRange, priceBounds]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleToggleCategory = (id: string) => {
    setSelectedCategories((prev) => toggle(prev, id));
    setPage(1);
  };
  const handleToggleDuration = (id: string) => {
    setSelectedDurations((prev) => toggle(prev, id));
    setPage(1);
  };
  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range);
    setPage(1);
  };
  const handleClear = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedDurations([]);
    setPriceRange(null);
    setPage(1);
  };

  const handleRegionChange = (region: typeof activeRegion) => {
    setActiveRegion(region);
    setSearch('');
    setSelectedCategories([]);
    setSelectedDurations([]);
    setPriceRange(null);
    setPage(1);
  };

  return (
    <main className="mx-auto max-w-[1300px] px-3 sm:px-6 py-10">
      <div className="mb-7 flex gap-2 overflow-x-auto scrollbar-none -mx-3 px-3 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
        {REGION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleRegionChange(tab.id as typeof activeRegion)}
            className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              activeRegion === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-70">
              ({tab.id === 'ALL' ? tours.length : tours.filter((t) => t.region === tab.id).length})
            </span>
          </button>
        ))}
      </div>
      <div className="grid gap-7 lg:grid-cols-[252px_1fr]">
        <div className="space-y-5">
          {priceBounds.min > 0 && (
            <AffordabilityWidget amount={priceBounds.min} title="Easy EMI Available" />
          )}
          <ToursFiltersSidebar
          browseCategories={browseCategories}
          search={search}
          onSearchChange={handleSearchChange}
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          durations={durations}
          selectedDurations={selectedDurations}
          onToggleDuration={handleToggleDuration}
          priceMin={priceBounds.min}
          priceMax={priceBounds.max}
          priceStep={PRICE_STEP}
          priceRange={effectiveRange}
          onPriceChange={handlePriceChange}
          onClear={handleClear}
          isMobileOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
        />
        </div>
        <ToursGridSection
          tours={paged}
          totalCount={filtered.length}
          sort={sort}
          onSortChange={(s) => {
            setSort(s);
            setPage(1);
          }}
          page={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
          onFilterToggle={() => setShowMobileFilters(true)}
          onClearFilters={handleClear}
        />
      </div>
    </main>
  );
}
