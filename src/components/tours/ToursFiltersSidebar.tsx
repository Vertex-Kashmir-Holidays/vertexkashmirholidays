'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Search, RotateCcw, X } from 'lucide-react';
import { formatINR } from '@/lib/accents';
import type { CategoryOption, DurationOption } from '@/types/tours';

interface ToursFiltersSidebarProps {
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
  onClear: () => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
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
  onClear,
}: ToursFiltersSidebarProps & { idPrefix: string }) {
  return (
    <>
      {/* Search */}
      <p className="text-[15px] font-bold">Search</p>
      <label className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          placeholder="Search tours..."
        />
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
      </label>

      {/* Categories */}
      <div className="mt-7">
        <p className="text-[15px] font-bold">Categories</p>
        <ul className="mt-3.5 space-y-3 text-[13px]">
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
              <label htmlFor={`${idPrefix}-cat-${c.id}`} className="flex w-full cursor-pointer items-center gap-2 text-foreground/85">
                <c.Icon size={18} strokeWidth={1.75} className="shrink-0 text-foreground/70" />
                {c.label}
              </label>
              <span className="text-[12px] text-muted-foreground">{c.count}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Duration */}
      <div className="mt-7 border-t border-border pt-6">
        <p className="text-[15px] font-bold">Duration (Days)</p>
        <ul className="mt-3.5 space-y-3 text-[13px]">
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
              <label htmlFor={`${idPrefix}-dur-${d.id}`} className="w-full cursor-pointer text-foreground/85">
                {d.label}
              </label>
              <span className="text-[12px] text-muted-foreground">{d.count}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div className="mt-7 border-t border-border pt-6">
        <p className="text-[15px] font-bold">
          Price Range <span className="text-[11px] font-medium text-muted-foreground">(per person)</span>
        </p>
        <div className="range-track mt-5">
          <div className="range-fill"></div>
          <motion.span className="thumb" style={{ left: '2%' }} whileHover={{ scale: 1.2 }}></motion.span>
          <motion.span className="thumb" style={{ left: '98%' }} whileHover={{ scale: 1.2 }}></motion.span>
        </div>
        <div className="mt-3 flex justify-between text-[12px] font-semibold text-foreground/80">
          <span>{formatINR(priceMin)}</span>
          <span>{formatINR(priceMax)}</span>
        </div>
      </div>

      <motion.button
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary py-2.5 text-[13px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
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
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return (
      <motion.aside
        className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <FilterContent {...props} idPrefix="desktop" />
      </motion.aside>
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
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4">
              <h3 className="text-[17px] font-bold">Filters</h3>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
