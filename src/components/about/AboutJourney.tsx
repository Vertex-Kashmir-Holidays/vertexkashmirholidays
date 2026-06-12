// src/components/sections/AboutJourney.tsx
'use client';

import { motion } from 'framer-motion';

export function AboutJourney() {
  const journey = [
    { y: '2010', d: 'Started with a single taxi in Srinagar.', icon: 'M11 20A7 7 0 0 1 4 13c0-4 3-8 8-10 5 2 8 6 8 10a7 7 0 0 1-7 7M12 22v-8' },
    { y: '2012', d: 'First 100+ guests and our first team members.', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9' },
    { y: '2015', d: '5000+ travellers and 100+ curated itineraries.', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 2v3M12 19v3M2 12h3M19 12h3' },
    { y: '2018', d: 'Guests from 30+ countries joined us.', icon: 'M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18' },
    { y: '2021', d: '4.9★ average rating across all platforms.', icon: 'm12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z' },
    { y: '2024', d: '12,000+ travellers. Still just getting started.', icon: 'm3 20 6-12 4 7 3-4 5 9Z' },
  ];

  return (
    <section className="mx-auto max-w-[1300px] px-6 pb-14">
      <motion.div
        className="rounded-2xl bg-brand-cream p-7 lg:p-9"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid items-center gap-8 lg:grid-cols-[230px_1fr]">
          <div>
            <p className="text-[11.5px] font-bold tracking-[0.22em] text-brand-green2">OUR JOURNEY</p>
            <h2 className="h-display mt-3 font-display text-[30px] font-bold leading-snug">15+ Years of<br/>Growing Together</h2>
          </div>
          <div className="scrollbar-none overflow-x-auto">
            <div className="relative min-w-[760px] pt-2">
              <div className="absolute left-0 right-0 top-[58px] h-px bg-brand-green2/40"></div>
              <div className="relative grid grid-cols-6 gap-3">
                {journey.map((j, i) => (
                  <motion.div
                    key={i}
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-brand-green2/30 bg-white text-brand-green2 shadow-soft">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d={j.icon} />
                      </svg>
                    </span>
                    <span className="mx-auto mt-2 block h-2.5 w-2.5 rounded-full bg-brand-green2 ring-4 ring-brand-cream"></span>
                    <p className="mt-2.5 text-[14px] font-extrabold">{j.y}</p>
                    <p className="mx-auto mt-1 max-w-[120px] text-[10.5px] leading-relaxed text-brand-mute">{j.d}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}