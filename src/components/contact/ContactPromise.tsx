// src/components/sections/ContactPromise.tsx
'use client';

import { motion } from 'framer-motion';

export function ContactPromise() {
  const promise = [
    { t: 'Quick Response', s: 'We reply within 2 hours, always.', icon: 'M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 3M5 3 3 5M19 3l2 2' },
    { t: 'Real Human Help', s: 'Talk to our local Kashmiri experts.', icon: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0' },
    { t: 'Custom & Honest', s: 'No generic packages. Only what suits you.', icon: 'M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9 12l2 2 4-5' },
    { t: 'Happy or We Fix', s: 'Your happiness is our #1 priority.', icon: 'M12 21C7 17 3 13.5 3 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 9 2.5c0 4-4 7.5-9 11.5Z' },
  ];

  return (
    <motion.div
      className="mt-7 rounded-2xl bg-brand-page p-6 lg:p-7"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[11px] font-bold tracking-[0.22em] text-brand-green2">WE CARE ABOUT YOUR TIME</p>
      <h2 className="h-display mt-2 font-display text-[24px] font-bold">Our Promise to You</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {promise.map((p, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-brand-green2/40 text-brand-green2">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={p.icon} />
              </svg>
            </span>
            <div>
              <p className="text-[13px] font-bold">{p.t}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-brand-mute">{p.s}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}