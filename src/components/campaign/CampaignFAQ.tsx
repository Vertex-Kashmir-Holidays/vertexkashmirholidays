// src/components/campaign/CampaignFAQ.tsx
'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { CampaignFaq } from '@/types/campaign';

interface CampaignFAQProps {
  title: string | null;
  faqs: CampaignFaq[];
}

export function CampaignFAQ({ title, faqs }: CampaignFAQProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[760px] px-6 pt-20">
      {title && (
        <motion.h2
          className="h-display text-center text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
      )}
      <div className="mt-9 space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="glass rounded-2xl px-5 py-4">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-[13.5px] font-bold text-foreground">
              {faq.question}
              <ChevronDown className="chev h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2.4} />
            </summary>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
