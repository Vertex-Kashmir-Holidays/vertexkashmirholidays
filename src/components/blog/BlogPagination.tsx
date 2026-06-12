// src/components/sections/BlogPagination.tsx
'use client';

import { motion } from 'framer-motion';

export function BlogPagination() {
  const pages = ['1', '2', '3', '4', '5', '…', '12'];

  return (
    <nav className="mt-9 flex items-center justify-center gap-2" aria-label="Pagination">
      {pages.map((p, i) => {
        if (p === '…') {
          return (
            <span key={i} className="px-1 text-brand-mute">
              …
            </span>
          );
        }
        const isActive = p === '1';
        return (
          <motion.button
            key={i}
            className={`grid h-9 w-9 place-items-center rounded-lg text-[13px] font-semibold transition ${
              isActive
                ? 'bg-brand-green text-white shadow-card'
                : 'border border-brand-line bg-white text-brand-ink shadow-soft hover:border-brand-green2 hover:text-brand-green2'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {p}
          </motion.button>
        );
      })}
      <motion.button
        className="ml-1 flex items-center gap-1.5 rounded-lg border border-brand-line bg-white px-4 py-2 text-[13px] font-semibold shadow-soft transition hover:border-brand-green2 hover:text-brand-green2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Next
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </motion.button>
    </nav>
  );
}