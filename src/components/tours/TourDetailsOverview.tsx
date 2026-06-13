// src/components/sections/TourDetailsOverview.tsx
'use client';

import { motion } from 'framer-motion';

interface TourDetailsOverviewProps {
  description: string;
  chips: string[];
}

export function TourDetailsOverview({ description, chips }: TourDetailsOverviewProps) {
  return (
    <motion.section
      id="overview"
      className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[17px] font-bold">Overview</h2>
      <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/75">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {chips.map((chip, i) => (
          <motion.span
            key={i}
            className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-[12.5px] font-semibold"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            {chip}
          </motion.span>
        ))}
      </div>
    </motion.section>
  );
}