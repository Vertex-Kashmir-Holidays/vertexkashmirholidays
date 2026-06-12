// src/components/sections/DestinationsFilterBar.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface DestinationsFilterBarProps {
  onFilterChange: (chip: string, search: string) => void;
}

export function DestinationsFilterBar({ onFilterChange }: DestinationsFilterBarProps) {
  const [activeChip, setActiveChip] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const chips = ['All', 'Kashmir Valley', 'Gulmarg', 'Pahalgam', 'Sonmarg', 'Ladakh', 'Other States'];

  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    onFilterChange(chip, searchQuery);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onFilterChange(activeChip, value);
  };

  return (
    <section className="relative z-10 -mt-7 rounded-t-[28px] bg-white pt-8">
      <div className="mx-auto flex max-w-[1300px] flex-wrap items-center gap-3 px-6">
        {/* Search */}
        <label className="flex w-full max-w-[235px] items-center gap-2.5 rounded-full border border-brand-line bg-white px-4 py-2.5 shadow-soft">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
          <input
            value={searchQuery}
            onChange={handleSearch}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-brand-mute"
            placeholder="Search destinations..."
          />
        </label>

        {/* Chips */}
        <div className="scrollbar-none flex flex-1 gap-2 overflow-x-auto">
          {chips.map((chip, i) => (
            <motion.button
              key={i}
              onClick={() => handleChipClick(chip)}
              className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold shadow-soft transition ${
                activeChip === chip
                  ? 'bg-brand-green text-white'
                  : 'border border-brand-line bg-white text-brand-ink/80 hover:border-brand-green2 hover:text-brand-green2'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {chip}
            </motion.button>
          ))}
        </div>

        {/* Sort */}
        <button className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-brand-line bg-white px-4 py-2.5 text-[13px] font-semibold shadow-soft">
          Sort by: Popular
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </section>
  );
}