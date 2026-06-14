// src/components/blog/BlogCategoryChips.tsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { BlogChipData } from '@/types/blog';

interface BlogCategoryChipsProps {
  chips: BlogChipData[];
  onCategoryChange: (category: string) => void;
}

export function BlogCategoryChips({ chips, onCategoryChange }: BlogCategoryChipsProps) {
  const [activeChip, setActiveChip] = useState('All');

  // "All" is always first; the rest come from the DB-driven categories.
  const allChips: BlogChipData[] = [{ name: 'All', slug: 'all', icon: '' }, ...chips];

  const handleChipClick = (name: string) => {
    setActiveChip(name);
    onCategoryChange(name);
  };

  return (
    <div className="border-b border-border bg-background">
      <div className="scrollbar-none mx-auto flex max-w-[1300px] gap-2.5 overflow-x-auto px-6 py-5">
        {allChips.map((chip, i) => (
          <motion.button
            key={i}
            onClick={() => handleChipClick(chip.name)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold shadow-soft transition ${
              activeChip === chip.name
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground/80 hover:border-primary hover:text-primary'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {chip.icon && (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d={chip.icon} />
              </svg>
            )}
            {chip.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
