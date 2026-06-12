// src/components/sections/BlogCategoryChips.tsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface BlogCategoryChipsProps {
  onCategoryChange: (category: string) => void;
}

export function BlogCategoryChips({ onCategoryChange }: BlogCategoryChipsProps) {
  const [activeChip, setActiveChip] = useState('All');

  const chips = [
    { label: 'All', icon: '' },
    { label: 'Kashmir', icon: 'm3 20 6-12 4 7 3-4 5 9Z' },
    { label: 'Travel Tips', icon: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' },
    { label: 'Honeymoon', icon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z' },
    { label: 'Adventure', icon: 'm8 3 4 8 5-5 4 14H3l5-7Z' },
    { label: 'Food', icon: 'M4 19h16 M5 19a7 7 0 0 1 14 0 M12 12V9' },
    { label: 'Culture', icon: 'M12 3 3 8v2h18V8Z M5 10v8 M9.5 10v8 M14.5 10v8 M19 10v8 M3 21h18' },
    { label: 'News', icon: 'M4 22h14a2 2 0 0 0 2-2V6l-4-4H6a2 2 0 0 0-2 2v16Z M8 10h8 M8 14h8 M8 18h5' },
  ];

  const handleChipClick = (label: string) => {
    setActiveChip(label);
    onCategoryChange(label);
  };

  return (
    <div className="border-b border-brand-line bg-white">
      <div className="scrollbar-none mx-auto flex max-w-[1300px] gap-2.5 overflow-x-auto px-6 py-5">
        {chips.map((chip, i) => (
          <motion.button
            key={i}
            onClick={() => handleChipClick(chip.label)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold shadow-soft transition ${
              activeChip === chip.label
                ? 'bg-brand-green text-white'
                : 'border border-brand-line bg-white text-brand-ink/80 hover:border-brand-green2 hover:text-brand-green2'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {chip.icon && (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d={chip.icon} />
              </svg>
            )}
            {chip.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}