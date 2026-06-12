// src/components/sections/AboutValues.tsx
'use client';

import { motion } from 'framer-motion';

export function AboutValues() {
  const values = [
    { t: 'Honest & Transparent', s: 'Clear itineraries, clear pricing, no last-minute surprises.', icon: 'M19 14a7 7 0 1 0-14 0M12 14v-3M3 18c3 1.5 6 2 9 2s6-.5 9-2M12 7a2.5 2.5 0 0 1 2.5 2.5' },
    { t: 'Responsible Tourism', s: 'We protect our mountains, lakes, and local communities.', icon: 'M11 20A7 7 0 0 1 4 13c0-4 3-8 8-10 5 2 8 6 8 10a7 7 0 0 1-7 7M12 22v-8M9 12l3 2 3-2' },
    { t: 'Quality Experiences', s: 'Hand-picked stays, verified drivers, and thoughtful touches.', icon: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0M17 4l1 1 2-2' },
    { t: 'Here When You Need Us', s: 'Real people. Real support. Anytime, anywhere.', icon: 'M3 12a9 9 0 1 1 18 0v5a2 2 0 0 1-2 2h-3v-6h5M3 12v5a2 2 0 0 0 2 2h3v-6H3' },
  ];

  return (
    <section className="mx-auto mt-14 max-w-[1300px] px-6">
      <motion.div
        className="rounded-2xl bg-brand-cream p-7 lg:p-9"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
          <div>
            <p className="text-[11.5px] font-bold tracking-[0.22em] text-brand-green2">OUR VALUES</p>
            <h2 className="h-display mt-3 font-display text-[30px] font-bold leading-snug">The Promises<br/>We Keep</h2>
            <p className="mt-4 text-[12.5px] leading-relaxed text-brand-mute">These aren't just words on a page. They're how we run every trip, every day.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((val, i) => (
              <motion.div
                key={i}
                className="rounded-xl bg-white p-5 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-sand text-brand-green">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={val.icon} />
                  </svg>
                </span>
                <p className="mt-4 text-[14px] font-bold">{val.t}</p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-brand-mute">{val.s}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}