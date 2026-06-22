// src/components/contact/ContactFAQs.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import type { ContactFaqData, ContactSectionHeading } from '@/types/contact';

interface ContactFAQsProps {
  heading: ContactSectionHeading;
  faqs: ContactFaqData[];
  ctaLabel: string | null;
  ctaHref: string | null;
}

export function ContactFAQs({ heading, faqs, ctaLabel, ctaHref }: ContactFAQsProps) {
  if (faqs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
      <h2 className="h-display mt-2 font-display text-[22px] font-bold">{heading.title}</h2>
      <div className="mt-5 space-y-2.5">
        {faqs.map((faq) => (
          <details key={faq.id} className="rounded-lg border border-border bg-card px-4 py-3 shadow-soft">
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-[12.5px] font-semibold">
              {faq.question}
              <ChevronDown className="chev h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2.4} />
            </summary>
            <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
      {ctaLabel && (
        <Link href={ctaHref ?? '#'} className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary hover:underline">
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </Link>
      )}
    </motion.div>
  );
}
