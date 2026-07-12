// src/components/campaign/CampaignDepartures.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { CampaignBatch } from '@/types/campaign';

interface CampaignDeparturesProps {
  batches: CampaignBatch[];
}

const statusMap = {
  filling: { label: 'FILLING FAST', className: 'bg-amber-400/15 text-amber-500 dark:text-amber-300' },
  open: { label: 'AVAILABLE', className: 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-300' },
  sold: { label: 'SOLD OUT', className: 'bg-rose-400/15 text-rose-500 dark:text-rose-300' },
};

export function CampaignDepartures({ batches }: CampaignDeparturesProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[900px] px-6 pt-20" id="departures">
      <div className="text-center">
        <motion.p
          className="text-[12px] font-extrabold tracking-[0.24em] text-camp-accent"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          FIXED DEPARTURES
        </motion.p>
        <motion.h2
          className="h-display mt-3 text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Upcoming batches
        </motion.h2>
      </div>
      <motion.div
        className="glass mt-9 overflow-hidden rounded-3xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="hidden grid-cols-[1.3fr_1fr_1fr_.9fr] gap-4 border-b border-border px-6 py-3.5 text-[12px] font-extrabold tracking-wide text-muted-foreground sm:grid">
          <span>DATES</span>
          <span>SEATS LEFT</span>
          <span>PRICE / PERSON</span>
          <span></span>
        </div>
        <div className="divide-y divide-border">
          {batches.map((batch, i) => {
            const status = statusMap[batch.status];
            const isSold = batch.status === 'sold';
            return (
              <div
                key={i}
                className={`grid grid-cols-2 items-center gap-x-4 gap-y-2 px-6 py-4 sm:grid-cols-[1.3fr_1fr_1fr_.9fr] ${isSold ? 'opacity-45' : ''}`}
              >
                <p className="col-span-2 text-[14px] font-bold text-foreground sm:col-span-1">{batch.date}</p>
                <p className={`text-[14px] font-semibold ${batch.seats > 0 && batch.seats <= 4 ? 'text-amber-500 dark:text-amber-300' : 'text-muted-foreground'}`}>
                  {isSold ? '—' : `${batch.seats} left`}
                </p>
                <p className="text-[16px] font-extrabold text-foreground">{batch.price}</p>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className={`rounded-full px-3 py-1 text-[12px] font-extrabold ${status.className}`}>
                    {status.label}
                  </span>
                  {!isSold && (
                    <Link
                      href="#reserve"
                      className="rounded-lg bg-accent-grad px-4 py-1.5 text-[12px] font-extrabold text-white ring-inner transition hover:brightness-110"
                    >
                      Book
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
      <motion.p
        className="mt-5 text-center text-[14px] text-muted-foreground"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Need different dates or a private batch?{' '}
        <a href="#reserve" className="font-bold text-camp-accent hover:underline">Talk to us</a> — we run custom departures for groups of 4+.
      </motion.p>
    </section>
  );
}
