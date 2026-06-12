// src/components/sections/AboutCTA.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function AboutCTA() {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      <motion.img
        src="https://picsum.photos/seed/cta-valley/1800/420"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-55"
        initial={{ scale: 1.1 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/55 to-brand-dark/35"></div>
      <div className="relative mx-auto flex max-w-[1300px] flex-wrap items-center justify-between gap-8 px-6 py-14">
        <div>
          <h2 className="h-display font-display text-[32px] font-bold leading-snug text-white">
            Come as a guest,<br/>leave as family.
          </h2>
          <p className="mt-3 text-[14px] text-white/80">Let's plan your Kashmir story.</p>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <Link
            href="#"
            className="inline-flex items-center gap-2.5 rounded-lg bg-brand-bright px-6 py-3.5 text-[13.5px] font-bold text-white shadow-card transition hover:brightness-110"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z" />
            </svg>
            Chat on WhatsApp
          </Link>
          <Link
            href="#"
            className="inline-flex items-center gap-2.5 rounded-lg border border-white/55 px-6 py-3.5 text-[13.5px] font-semibold text-white backdrop-blur transition hover:bg-white hover:text-brand-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
            </svg>
            Call Us Now
          </Link>
          <Link
            href="#"
            className="inline-flex items-center gap-2.5 rounded-lg border border-white/55 px-6 py-3.5 text-[13.5px] font-semibold text-white backdrop-blur transition hover:bg-white hover:text-brand-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>
            Email Us
          </Link>
        </div>
      </div>
    </section>
  );
}