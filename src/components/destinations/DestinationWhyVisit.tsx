// src/components/destinations/DestinationWhyVisit.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface DestinationWhyVisitProps {
  name: string;
  reasons: string[];
}

// Same list/icon idiom as TourDetailsHighlights.
export function DestinationWhyVisit({ name, reasons }: DestinationWhyVisitProps) {
  if (reasons.length === 0) return null;

  return (
    <motion.section
      id="why-visit"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[18px] font-bold">Why Visit {name}</h2>
      <ul className="mt-4 space-y-3 text-[14px] text-foreground/80">
        {reasons.map((item, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-2.5"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
            {item}
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
