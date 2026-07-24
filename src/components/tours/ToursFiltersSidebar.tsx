"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_BRAND } from "@/lib/motion";
import { useState, useEffect } from "react";
import { Search, RotateCcw, X, ArrowRight } from "lucide-react";
import type { TourCategory } from "@prisma/client";
import { PriceRangeSlider } from "@/components/ui/molecules/PriceRangeSlider";
import { TOUR_CATEGORY_META } from "@/lib/tours/categories";
import type { CategoryOption, DurationOption } from "@/types/tours";

interface ToursFiltersSidebarProps {
  browseCategories: TourCategory[];
  search: string;
  onSearchChange: (value: string) => void;
  categories: CategoryOption[];
  selectedCategories: string[];
  onToggleCategory: (id: string) => void;
  durations: DurationOption[];
  selectedDurations: string[];
  onToggleDuration: (id: string) => void;
  priceMin: number;
  priceMax: number;
  priceStep: number;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  onClear: () => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

// Separate card of internal links to category landing pages — kept apart from
// the filter card since it navigates away rather than filtering in place.
function BrowseByTypeCard({ browseCategories }: { browseCategories: TourCategory[] }) {
  if (browseCategories.length === 0) return null;
  return (
    <div className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-[16px] font-bold">Browse by Type</p>
      <ul className="mt-3.5 space-y-2.5 text-[14px]">
        {browseCategories.map((c) => (
          <li key={c}>
            <Link
              href={`/tours/category/${TOUR_CATEGORY_META[c].slug}`}
              className="text-foreground/85 transition hover:text-primary hover:underline"
            >
              {TOUR_CATEGORY_META[c].pageTitle}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/tours/category"
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:underline"
      >
        View all categories
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
      </Link>
    </div>
  );
}

// Shared between the desktop sidebar and the mobile drawer. Defined at module
// level so controlled inputs keep focus across parent re-renders; idPrefix
// keeps checkbox ids unique per variant.
function FilterContent({
  idPrefix,
  search,
  onSearchChange,
  categories,
  selectedCategories,
  onToggleCategory,
  durations,
  selectedDurations,
  onToggleDuration,
  priceMin,
  priceMax,
  priceStep,
  priceRange,
  onPriceChange,
  onClear,
}: ToursFiltersSidebarProps & { idPrefix: string }) {
  return (
    <>
      {/* Search */}
      <p className="text-[16px] font-bold">Search</p>
      <label className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          placeholder="Search tours..."
        />
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
      </label>

      {/* Categories */}
      <div className="mt-7">
        <p className="text-[16px] font-bold">Categories</p>
        <ul className="mt-3.5 space-y-3 text-[14px]">
          {categories.map((c, i) => (
            <motion.li
              key={c.id}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <input
                type="checkbox"
                className="cbx"
                checked={selectedCategories.includes(c.id)}
                onChange={() => onToggleCategory(c.id)}
                id={`${idPrefix}-cat-${c.id}`}
              />
              <label
                htmlFor={`${idPrefix}-cat-${c.id}`}
                className="flex w-full cursor-pointer items-center gap-2 text-foreground/85"
              >
                <c.Icon size={18} strokeWidth={1.75} className="shrink-0 text-foreground/70" />
                {c.label}
              </label>
              <span className="text-[14px] text-muted-foreground">{c.count}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Duration */}
      <div className="mt-7 border-t border-border pt-6">
        <p className="text-[16px] font-bold">Duration (Days)</p>
        <ul className="mt-3.5 space-y-3 text-[14px]">
          {durations.map((d, i) => (
            <motion.li
              key={d.id}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.2 }}
            >
              <input
                type="checkbox"
                className="cbx"
                checked={selectedDurations.includes(d.id)}
                onChange={() => onToggleDuration(d.id)}
                id={`${idPrefix}-dur-${d.id}`}
              />
              <label
                htmlFor={`${idPrefix}-dur-${d.id}`}
                className="w-full cursor-pointer text-foreground/85"
              >
                {d.label}
              </label>
              <span className="text-[14px] text-muted-foreground">{d.count}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div className="mt-7 border-t border-border pt-6">
        <p className="text-[16px] font-bold">
          Price Range{" "}
          <span className="text-[12px] font-medium text-muted-foreground">(per person)</span>
        </p>
        <PriceRangeSlider
          min={priceMin}
          max={priceMax}
          step={priceStep}
          value={priceRange}
          onChange={onPriceChange}
        />
      </div>

      <motion.button
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClear}
      >
        Clear Filters
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
      </motion.button>
    </>
  );
}

export function ToursFiltersSidebar(props: ToursFiltersSidebarProps) {
  const { isMobileOpen = false, onClose } = props;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) {
    return (
      <>
        <motion.aside
          className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: EASE_BRAND }}
        >
          <FilterContent {...props} idPrefix="desktop" />
        </motion.aside>
        <BrowseByTypeCard browseCategories={props.browseCategories} />
      </>
    );
  }

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-full max-w-[320px] overflow-y-auto bg-card shadow-2xl lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4">
              <h3 className="text-[18px] font-bold">Filters</h3>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5">
              <FilterContent {...props} idPrefix="mobile" />
            </div>
            <div className="mt-5 px-5 pb-5">
              <BrowseByTypeCard browseCategories={props.browseCategories} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
