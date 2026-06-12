'use client';

import { useMemo, useState } from 'react';
import { ToursFiltersSidebar } from '@/components/tours/ToursFiltersSidebar';
import { ToursGridSection } from '@/components/tours/ToursGridSection';
import type { TourListItemData, TourSortOption } from '@/types/tours';

interface ToursPageClientProps {
  tours: TourListItemData[];
}

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  HONEYMOON: { label: 'Honeymoon', emoji: '❤️' },
  FAMILY: { label: 'Family', emoji: '👨‍👩‍👧' },
  ADVENTURE: { label: 'Adventure', emoji: '🏔️' },
  LUXURY: { label: 'Luxury', emoji: '👑' },
};

const DURATION_BUCKETS = [
  { id: '1-3', label: '1 – 3 Days', min: 1, max: 3 },
  { id: '4-6', label: '4 – 6 Days', min: 4, max: 6 },
  { id: '7-10', label: '7 – 10 Days', min: 7, max: 10 },
  { id: '10+', label: '10+ Days', min: 11, max: Infinity },
];

const PAGE_SIZE = 9;

export function ToursPageClient({ tours }: ToursPageClientProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [sort, setSort] = useState<TourSortOption>('popular');
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () =>
      Object.entries(CATEGORY_META).map(([id, meta]) => ({
        id,
        ...meta,
        count: tours.filter((t) => t.category === id).length,
      })),
    [tours],
  );

  const durations = useMemo(
    () =>
      DURATION_BUCKETS.map((b) => ({
        id: b.id,
        label: b.label,
        count: tours.filter((t) => t.durationDays >= b.min && t.durationDays <= b.max).length,
      })),
    [tours],
  );

  const priceBounds = useMemo(() => {
    if (tours.length === 0) return { min: 0, max: 0 };
    const prices = tours.map((t) => t.priceFrom);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [tours]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = tours.filter((t) => {
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
      return searchMatch && categoryMatch && durationMatch;
    });

    // "popular" keeps the server order (bestseller first, then rating)
    if (sort === 'price-asc') result.sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === 'price-desc') result.sort((a, b) => b.priceFrom - a.priceFrom);
    if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [tours, search, selectedCategories, selectedDurations, sort]);

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
  const handleClear = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedDurations([]);
    setPage(1);
  };

  return (
    <main className="mx-auto max-w-[1300px] px-6 py-10">
      <div className="grid gap-7 lg:grid-cols-[252px_1fr]">
        <ToursFiltersSidebar
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
          onClear={handleClear}
          isMobileOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
        />
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
