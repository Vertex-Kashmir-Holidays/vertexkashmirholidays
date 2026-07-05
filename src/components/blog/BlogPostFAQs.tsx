// src/components/blog/BlogPostFAQs.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQ {
  question: string;
  answer: string;
}

interface BlogPostFAQsProps {
  faqs: FAQ[];
}

export function BlogPostFAQs({ faqs }: BlogPostFAQsProps) {
  const [openIndex, setOpenIndex] = useState<number>(-1);

  if (faqs.length === 0) return null;

  return (
    <motion.section
      id="faqs"
      className="mt-10 scroll-mt-28 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[17px] font-bold">Frequently Asked Questions</h2>
      <div className="mt-4 divide-y divide-border">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;

          return (
            <div key={i} className="py-3.5">
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-[13.5px] font-bold"
              >
                {faq.question}
                <motion.svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
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
                    className="mt-2.5 text-[13px] leading-relaxed text-foreground/70"
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
