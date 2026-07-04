// src/components/sections/TourDetailsFitCheck.tsx
'use client';

import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface TourDetailsFitCheckProps {
  perfectFor: string[];
  notIdealFor: string[];
}

export function TourDetailsFitCheck({ perfectFor, notIdealFor }: TourDetailsFitCheckProps) {
  if (perfectFor.length === 0 && notIdealFor.length === 0) return null;

  return (
    <motion.section
      id="fit"
      className="mt-6 grid gap-5 md:grid-cols-2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {perfectFor.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-[17px] font-bold">Perfect For</h2>
          <ul className="mt-4 space-y-3 text-[13px] text-foreground/80">
            {perfectFor.map((item, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2.5"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                  <ThumbsUp className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {notIdealFor.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-[17px] font-bold">Not Ideal For</h2>
          <ul className="mt-4 space-y-3 text-[13px] text-foreground/80">
            {notIdealFor.map((item, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2.5"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-red-500 text-white">
                  <ThumbsDown className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
}
