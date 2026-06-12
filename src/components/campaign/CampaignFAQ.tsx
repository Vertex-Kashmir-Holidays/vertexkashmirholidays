// src/components/sections/CampaignFAQ.tsx
'use client';

import { motion } from 'framer-motion';

interface FAQ {
  question: string;
  answer: string;
}

interface CampaignFAQProps {
  faqs: FAQ[];
}

export function CampaignFAQ({ faqs }: CampaignFAQProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[760px] px-6 pt-20">
      <motion.h2
        className="h-display text-center text-4xl font-bold text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Questions, <span className="grad-accent-text italic">answered</span>
      </motion.h2>
      <div className="mt-9 space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="glass rounded-2xl px-5 py-4">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-[13.5px] font-bold text-white">
              {faq.question}
              <svg viewBox="0 0 24 24" className="chev h-4 w-4 shrink-0 text-white/50" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="mt-3 text-[13px] leading-relaxed text-white/60">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}