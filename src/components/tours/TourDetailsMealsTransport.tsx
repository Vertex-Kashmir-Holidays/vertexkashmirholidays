// src/components/sections/TourDetailsMealsTransport.tsx
'use client';

import { motion } from 'framer-motion';

interface TourDetailsMealsTransportProps {
  meals?: string;
  transportDetail?: string;
}

export function TourDetailsMealsTransport({ meals, transportDetail }: TourDetailsMealsTransportProps) {
  const hasMeals = Boolean(meals);
  const hasTransport = Boolean(transportDetail);
  if (!hasMeals && !hasTransport) return null;

  return (
    <motion.section
      id="meals-transport"
      className="mt-6 grid gap-5 md:grid-cols-2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {hasMeals && (
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
          <h2 className="text-[18px] font-bold">Meals</h2>
          <p className="mt-4 text-[14px] leading-relaxed text-foreground/75">{meals}</p>
        </div>
      )}

      {hasTransport && (
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
          <h2 className="text-[18px] font-bold">Transport</h2>
          <p className="mt-4 text-[14px] leading-relaxed text-foreground/75">{transportDetail}</p>
        </div>
      )}
    </motion.section>
  );
}
