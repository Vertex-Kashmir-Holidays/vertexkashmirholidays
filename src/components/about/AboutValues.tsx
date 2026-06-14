// src/components/about/AboutValues.tsx
'use client';

import { motion } from 'framer-motion';
import { renderMint } from '@/lib/accents';
import type { AboutSectionHeading, AboutValueData } from '@/types/about';

interface AboutValuesProps {
  heading: AboutSectionHeading;
  values: AboutValueData[];
}

export function AboutValues({ heading, values }: AboutValuesProps) {
  if (values.length === 0) return null;

  return (
    <section className="mx-auto mt-14 max-w-[1300px] px-6">
      <motion.div
        className="rounded-2xl bg-muted p-7 lg:p-9"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
          <div>
            <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
            <h2 className="h-display mt-3 font-display text-[30px] font-bold leading-snug">{renderMint(heading.title)}</h2>
            <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">{heading.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((val, i) => (
              <motion.div
                key={val.id}
                className="rounded-xl bg-card p-5 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={val.icon} />
                  </svg>
                </span>
                <p className="mt-4 text-[14px] font-bold">{val.title}</p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{val.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
