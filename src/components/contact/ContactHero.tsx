// src/components/sections/ContactHero.tsx
'use client';

import { motion } from 'framer-motion';

export function ContactHero() {
  const heroFeats = [
    { t: '24×7 Support', s: 'Always here for you', icon: 'M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2ZM8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01' },
    { t: 'Quick Response', s: 'Within 2 hours', icon: 'M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 3' },
    { t: 'Real People', s: 'No bots, no wait', icon: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0' },
  ];

  return (
    <section className="relative overflow-hidden bg-brand-dark">
      <motion.img
        src="https://picsum.photos/seed/contact-hero/1800/600"
        alt="Houseboats on Dal Lake at dusk"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/40 to-transparent"></div>
      
      <div className="relative mx-auto max-w-[1300px] px-6 py-20 lg:py-24">
        <nav className="flex items-center gap-2 text-[12.5px] text-white/85" aria-label="Breadcrumb">
          <a href="/" className="transition hover:text-white">Home</a>
          <span>›</span>
          <span className="font-semibold text-white">Contact Us</span>
        </nav>
        <motion.h1
          className="h-display mt-6 font-display text-[42px] font-bold leading-[1.12] text-white lg:text-[48px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          We're Here<br/>When You Need Us
        </motion.h1>
        <motion.p
          className="mt-5 max-w-md text-[14.5px] leading-relaxed text-white/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Questions, custom trip requests, or just want local advice? Our team in Srinagar is ready to help you 24×7.
        </motion.p>
        <motion.div
          className="mt-9 flex flex-wrap gap-x-12 gap-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {heroFeats.map((feat, i) => (
            <div key={i} className="flex items-center gap-3 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/35">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={feat.icon} />
                </svg>
              </span>
              <div className="leading-tight">
                <p className="text-[13.5px] font-bold">{feat.t}</p>
                <p className="text-[11.5px] text-white/70">{feat.s}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}