// src/components/sections/AboutStats.tsx
'use client';

import { motion } from 'framer-motion';

export function AboutStats() {
  const stats = [
    { v: '12,000+', l: 'Happy Travellers', icon: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0' },
    { v: '500+', l: 'Curated Trips', icon: 'M3 11h18l-2 8H5ZM8 11V7a4 4 0 0 1 8 0v4' },
    { v: '4.9 / 5', l: 'Average Rating', icon: 'm12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z' },
    { v: '45+', l: 'Countries', icon: 'M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18' },
    { v: '15+', l: 'Years of Experience', icon: 'M3 4h18v18H3ZM16 2v4M8 2v4M3 10h18' },
  ];

  return (
    <section className="mx-auto max-w-[1300px] px-6">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-brand-dark"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <img
          src="https://picsum.photos/seed/stats-mtn/1400/300"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/60 via-transparent to-brand-dark/60"></div>
        <div className="relative grid grid-cols-2 gap-y-7 px-6 py-8 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-white/15">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="flex items-center justify-center gap-3.5 px-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d={stat.icon} />
              </svg>
              <div className="leading-tight">
                <p className="text-[20px] font-extrabold text-white">{stat.v}</p>
                <p className="text-[11px] text-white/65">{stat.l}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}