// src/components/activities/ActivityHighlights.tsx
'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Highlight {
  name: string;
  description: string;
}

interface ActivityHighlightsProps {
  highlights: Highlight[];
}

export function ActivityHighlights({ highlights }: ActivityHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <motion.section
      id="highlights"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[17px] font-bold">Activity Highlights</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {highlights.map((h, i) => (
          <motion.div
            key={i}
            className="rounded-xl border border-border p-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start gap-2.5">
              <Star className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} fill="currentColor" />
              <div>
                <p className="text-[13.5px] font-bold">{h.name}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{h.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
