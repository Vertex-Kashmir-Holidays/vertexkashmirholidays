// src/components/about/AboutStory.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { imgSrc } from '@/lib/placeholder';
import { renderMint } from '@/lib/accents';
import type { AboutStoryData, AboutStoryFeatureData } from '@/types/about';

interface AboutStoryProps {
  data: AboutStoryData;
  features: AboutStoryFeatureData[];
}

export function AboutStory({ data, features }: AboutStoryProps) {
  return (
    <section id="story" className="mx-auto max-w-[1300px] px-6 py-14">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
        <motion.div
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src={imgSrc(data.image)}
            alt="Houseboat and shikara on Dal Lake"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">{data.kicker}</p>
          <h2 className="h-display mt-3 font-display text-[17px] font-bold leading-snug">
            {renderMint(data.title)}
          </h2>
          <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-foreground/75">
            {data.body}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4">
            {features.map((feat, i) => (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-primary">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={feat.icon} />
                  </svg>
                </span>
                <p className="mt-3 text-[13px] font-bold leading-snug">{feat.title}</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{feat.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
