// src/components/sections/TourDetailsHighlights.tsx
'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface TourDetailsHighlightsProps {
  highlights: string[];
}

export function TourDetailsHighlights({ highlights }: TourDetailsHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <motion.section
      id="highlights"
      className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[18px] font-bold">Tour Highlights</h2>
      <ul className="mt-4 space-y-3 text-[14px] text-foreground/80">
        {highlights.map((item, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-2.5"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Star className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} fill="currentColor" />
            {item}
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
