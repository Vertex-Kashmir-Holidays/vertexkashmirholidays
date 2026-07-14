'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOUR_CATEGORY_HUB_FAQS, type TourCategoryHubFaqItem } from '@/lib/tours/categoryHubFaqs';

interface TourCategoryHubFaqProps {
  faqs?: TourCategoryHubFaqItem[];
}

export function TourCategoryHubFaq({ faqs = TOUR_CATEGORY_HUB_FAQS }: TourCategoryHubFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqs.length === 0) return null;

  return (
    <section>
      <h2 className="h-display text-[22px] font-bold text-foreground sm:text-[26px]">
        Frequently Asked Questions
      </h2>
      <div className="mt-6 space-y-3">
        {faqs.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div key={faq.question} className="rounded-lg border border-border bg-card shadow-soft transition-colors hover:border-primary/30">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <h3 className="text-[14px] font-bold text-foreground leading-snug">{faq.question}</h3>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300', open && 'rotate-180 text-primary')}
                  strokeWidth={2.4}
                />
              </button>
              <div className={cn('grid transition-[grid-template-rows] duration-300 ease-in-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="overflow-hidden">
                  <p className="px-4 pb-3.5 text-[14px] leading-relaxed text-muted-foreground">{faq.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
