// src/components/sections/TourDetailsFAQs.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQ {
  question: string;
  answer: string;
}

interface TourDetailsFAQsProps {
  faqs: FAQ[];
}

export function TourDetailsFAQs({ faqs }: TourDetailsFAQsProps) {
  const [openIndex, setOpenIndex] = useState<number>(-1);

  return (
    <motion.section
      id="faqs"
      className="mt-6 rounded-2xl border border-brand-line bg-white p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[17px] font-bold">FAQs</h2>
      <div className="mt-4 divide-y divide-brand-line">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;

          return (
            <div key={i} className="py-3.5">
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 text-[13.5px] font-bold"
              >
                {faq.question}
                <motion.svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 shrink-0 text-brand-mute transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.p
                    className="mt-2.5 text-[13px] leading-relaxed text-brand-ink/70"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}