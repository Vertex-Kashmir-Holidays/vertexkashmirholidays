// src/components/about/AboutStats.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { AboutStatData } from '@/types/about';

interface AboutStatsProps {
  stats: AboutStatData[];
  image: string | null;
}

export function AboutStats({ stats, image }: AboutStatsProps) {
  if (stats.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1300px] px-6">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-brand-dark"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {image && (
          <Image
            src={image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/60 via-transparent to-brand-dark/60"></div>
        <div className="relative grid grid-cols-2 gap-y-7 px-6 py-8 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-white/15">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.id}
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
                <p className="text-[20px] font-extrabold text-white">{stat.value}</p>
                <p className="text-[11px] text-white/65">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
