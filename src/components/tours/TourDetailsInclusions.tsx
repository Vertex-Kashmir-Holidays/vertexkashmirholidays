// src/components/sections/TourDetailsInclusions.tsx
'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface TourDetailsInclusionsProps {
  inclusions: string[];
  exclusions: string[];
}

export function TourDetailsInclusions({ inclusions, exclusions }: TourDetailsInclusionsProps) {
  return (
    <motion.section
      id="inclusions"
      className="mt-6 grid gap-5 md:grid-cols-2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
        <h2 className="text-[18px] font-bold">Inclusions</h2>
        <ul className="mt-4 space-y-3 text-[14px] text-foreground/80">
          {inclusions.map((item, i) => (
            <motion.li
              key={i}
              className="flex items-start gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
              </span>
              {item}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
        <h2 className="text-[18px] font-bold">Exclusions</h2>
        <ul className="mt-4 space-y-3 text-[14px] text-foreground/80">
          {exclusions.map((item, i) => (
            <motion.li
              key={i}
              className="flex items-start gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-red-500 text-white">
                <X className="h-2.5 w-2.5" strokeWidth={3.5} />
              </span>
              {item}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}