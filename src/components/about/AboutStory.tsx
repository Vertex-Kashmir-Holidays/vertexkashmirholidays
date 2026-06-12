// src/components/sections/AboutStory.tsx
'use client';

import { motion } from 'framer-motion';

export function AboutStory() {
  const features = [
    { t: 'Local & Independent', s: '100% locally owned and operated', icon: 'M5 3h14v18H5ZM9 8h6M9 12h6M9 16h3' },
    { t: 'Trusted by Thousands', s: '12,000+ happy travellers & counting', icon: 'm12 3 2.2 4.6 5 .7-3.6 3.5.9 5L12 14.5 7.5 16.8l.9-5L4.8 8.3l5-.7ZM12 17v4' },
    { t: 'Best Price Promise', s: 'No hidden costs. Ever.', icon: 'M12 9a6 6 0 1 0 0-12 6 6 0 0 0 0 12M9 14l-1.5 7L12 18.5 16.5 21 15 14' },
    { t: '24×7 On-ground', s: 'Support always with you', icon: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0' },
  ];

  return (
    <section id="story" className="mx-auto max-w-[1300px] px-6 py-14">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
        <motion.div
          className="overflow-hidden rounded-2xl shadow-card"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <img
            src="https://picsum.photos/seed/story-houseboat/900/680"
            alt="Houseboat and shikara on Dal Lake"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11.5px] font-bold tracking-[0.22em] text-brand-green2">OUR STORY</p>
          <h2 className="h-display mt-3 font-display text-[32px] font-bold leading-snug lg:text-[34px]">
            From a Small Dream<br/>to Thousands of Smiles
          </h2>
          <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-brand-ink/75">
            Vertex Kashmir Holidays began in 2010 with a single taxi and a big belief— that tourism in Kashmir can be honest, responsible, and world-class. Today, we've hosted 12,000+ travellers from 45+ countries. But we still treat every trip like it's for our own guests.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-cream text-brand-green2">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={feat.icon} />
                  </svg>
                </span>
                <p className="mt-3 text-[13px] font-bold leading-snug">{feat.t}</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-brand-mute">{feat.s}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}