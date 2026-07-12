// src/components/contact/ContactPromise.tsx
'use client';

import { motion } from 'framer-motion';
import type { ContactPromiseItemData, ContactSectionHeading } from '@/types/contact';

interface ContactPromiseProps {
  heading: ContactSectionHeading;
  items: ContactPromiseItemData[];
}

export function ContactPromise({ heading, items }: ContactPromiseProps) {
  if (items.length === 0) return null;

  return (
    <motion.div
      className="mt-7 rounded-2xl bg-muted p-6 lg:p-7"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[12px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
      <h2 className="h-display mt-2 font-display text-[18px] font-bold">{heading.title}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p, i) => (
          <motion.div
            key={p.id}
            className="flex items-start gap-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-primary/40 text-primary">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={p.icon} />
              </svg>
            </span>
            <div>
              <p className="text-[14px] font-bold">{p.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{p.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
