// src/components/sections/ContactFAQs.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function ContactFAQs() {
  const faqs = [
    { q: 'How soon will I get a reply?', a: 'Within 2 hours on WhatsApp and email during working hours — usually much faster.' },
    { q: 'Can you create a custom itinerary?', a: 'Absolutely. Every trip we plan is built from scratch around your dates, pace and budget.' },
    { q: 'Do you charge for itinerary planning?', a: 'No. Planning and advice are 100% free — you only pay when you book.' },
    { q: 'How do I book a trip with Vertex Kashmir?', a: 'Share your details, approve your itinerary, then lock dates with a 20% advance via Razorpay.' },
    { q: 'Is it safe to travel to Kashmir in 2026?', a: 'Yes — tourist areas are welcoming and well-connected. Our on-ground team is with you 24×7.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[11.5px] font-bold tracking-[0.22em] text-brand-green2">BEFORE YOU ASK...</p>
      <h2 className="h-display mt-2 font-display text-[22px] font-bold">Quick Answers</h2>
      <div className="mt-5 space-y-2.5">
        {faqs.map((faq, i) => (
          <details key={i} className="rounded-lg border border-brand-line bg-white px-4 py-3 shadow-soft">
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-[12.5px] font-semibold">
              {faq.q}
              <svg viewBox="0 0 24 24" className="chev h-3.5 w-3.5 shrink-0 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="mt-2.5 text-[12px] leading-relaxed text-brand-mute">{faq.a}</p>
          </details>
        ))}
      </div>
      <Link href="#" className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-green2 hover:underline">
        View all FAQs
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </motion.div>
  );
}