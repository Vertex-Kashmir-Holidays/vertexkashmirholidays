// src/components/campaign/CampaignHighlights.tsx
'use client';

import { motion } from 'framer-motion';
import { Tilt3D } from '@/components/ui/3DTilt';
import { imgSrc } from '@/lib/placeholder';
import type { CampaignHighlight } from '@/types/campaign';

interface CampaignHighlightsProps {
  title: string | null;
  highlights: CampaignHighlight[];
}

export function CampaignHighlights({ title, highlights }: CampaignHighlightsProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-20">
      <div className="text-center">
        <motion.p
          className="text-[12px] font-extrabold tracking-[0.24em] text-camp-accent"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          WHY THIS TRIP
        </motion.p>
        <motion.h2
          className="h-display mt-3 text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {title}
        </motion.h2>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((highlight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Tilt3D intensity={6}>
              <article className="glass relative overflow-hidden rounded-3xl shadow-card">
                <div className="relative h-36 overflow-hidden">
                  <img src={imgSrc(highlight.image)} alt="" className="h-full w-full object-cover" />
                  <span className="glass-strong absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-xl text-xl">
                    {highlight.emoji}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-[16px] font-bold text-foreground">{highlight.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{highlight.description}</p>
                </div>
              </article>
            </Tilt3D>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
