// src/components/destinations/DestinationTravelTips.tsx
'use client';

import { motion } from 'framer-motion';

interface DestinationTravelTipsProps {
  tips: string[];
}

export function DestinationTravelTips({ tips }: DestinationTravelTipsProps) {
  if (tips.length === 0) return null;

  return (
    <motion.section
      id="travel-tips"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[17px] font-bold">Travel Tips</h2>
      <ol className="mt-4 space-y-3 text-[13px] text-foreground/80">
        {tips.map((tip, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-2.5"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {i + 1}
            </span>
            {tip}
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}
