// src/components/sections/CampaignFinalCTA.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface CampaignFinalCTAProps {
  title: string;
  sub: string;
  cta: string;
  note: string;
  finalSeed: string;
}

export function CampaignFinalCTA({ title, sub, cta, note, finalSeed }: CampaignFinalCTAProps) {
  return (
    <section className="relative z-[2] mt-24 overflow-hidden">
      <motion.img
        src={`https://picsum.photos/seed/${finalSeed}/1800/700`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-navy-brand/82"></div>
      <div className="relative mx-auto max-w-[760px] px-6 py-24 text-center">
        <motion.h2
          className="h-display text-[36px] font-bold leading-snug text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="mt-4 text-[14.5px] text-white/70"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {sub}
        </motion.p>
        <motion.div
          className="mt-9 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="#reserve"
            className="sweep rounded-full bg-accent-grad px-9 py-4 text-[14.5px] font-extrabold text-white ring-inner shadow-glow transition hover:scale-[1.03]"
          >
            {cta} →
          </Link>
          <a
            href="tel:+919999999999"
            className="glass rounded-full px-9 py-4 text-[14px] font-semibold text-white transition hover:bg-white/15"
          >
            Call +91 99 9999 9999
          </a>
        </motion.div>
        <motion.p
          className="mt-7 text-[12px] text-white/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {note}
        </motion.p>
      </div>
    </section>
  );
}