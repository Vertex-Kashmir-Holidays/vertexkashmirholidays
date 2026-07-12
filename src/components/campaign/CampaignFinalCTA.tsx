// src/components/campaign/CampaignFinalCTA.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface CampaignFinalCTAProps {
  title: string | null;
  sub: string | null;
  cta: string;
  note: string | null;
  image: string | null;
  phone: string | null;
}

// Over-image CTA band — stays dark with white text in both themes.
export function CampaignFinalCTA({ title, sub, cta, note, image, phone }: CampaignFinalCTAProps) {
  return (
    <section className="relative z-[2] mt-24 overflow-hidden">
      {image && (
        <motion.img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      <div className="absolute inset-0 bg-[hsl(202_50%_6%/0.82)]"></div>
      <div className="relative mx-auto max-w-[760px] px-6 py-24 text-center">
        {title && (
          <motion.h2
            className="h-display text-[36px] font-bold leading-snug text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h2>
        )}
        {sub && (
          <motion.p
            className="mt-4 text-[16px] text-white/70"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {sub}
          </motion.p>
        )}
        <motion.div
          className="mt-9 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="#reserve"
            className="sweep rounded-full bg-accent-grad px-9 py-4 text-[16px] font-extrabold text-white ring-inner shadow-glow transition hover:scale-[1.03]"
          >
            {cta} →
          </Link>
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="rounded-full border border-white/20 bg-white/10 px-9 py-4 text-[16px] font-semibold text-white backdrop-blur-xl transition hover:bg-white/20"
            >
              Call {phone}
            </a>
          )}
        </motion.div>
        {note && (
          <motion.p
            className="mt-7 text-[14px] text-white/50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {note}
          </motion.p>
        )}
      </div>
    </section>
  );
}
