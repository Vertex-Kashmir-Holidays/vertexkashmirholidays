// src/components/sections/ContactReachCards.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function ContactReachCards() {
  const reach = [
    { t: 'WhatsApp', big: '+91 99 9999 9999', s: 'Instant reply<br/>Chat with our team', cta: 'Chat on WhatsApp', wa: true,
      icon: 'M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z' },
    { t: 'Call Us', big: '+91 99 9999 9999', s: 'Mon – Sat, 9 AM – 9 PM IST', cta: 'Call Now',
      icon: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z', stroke: true },
    { t: 'Email Us', big: 'hello@vertexkashmir.com', s: 'We reply within<br/>2 hours', cta: 'Send Email',
      icon: 'M2 4h20v16H2ZM22 7l-10 6L2 7', stroke: true },
    { t: 'Visit Us', big: 'Srinagar, Kashmir, India', s: 'Mon – Sat, 10 AM – 6 PM', cta: 'Get Directions',
      icon: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6', stroke: true },
  ];

  return (
    <div className="min-w-0">
      <motion.p
        className="text-[11.5px] font-bold tracking-[0.22em] text-brand-green2"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        GET IN TOUCH
      </motion.p>
      <motion.h2
        className="h-display mt-2 font-display text-[28px] font-bold"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Many Ways to Reach Us
      </motion.h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reach.map((r, i) => (
          <motion.article
            key={i}
            className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-5 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <span className={`grid h-14 w-14 place-items-center rounded-full ${r.wa ? 'bg-wa text-white' : 'bg-emerald-50 text-brand-green2'}`}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill={r.stroke ? 'none' : 'currentColor'} stroke={r.stroke ? 'currentColor' : 'none'} strokeWidth={r.stroke ? '1.7' : '0'} strokeLinecap="round" strokeLinejoin="round">
                <path d={r.icon} />
              </svg>
            </span>
            <p className="mt-3.5 text-[14.5px] font-bold">{r.t}</p>
            <p className="mt-1.5 break-all text-[12.5px] font-semibold text-brand-ink/85">{r.big}</p>
            <p className="mt-2 flex-1 text-[11.5px] leading-relaxed text-brand-mute" dangerouslySetInnerHTML={{ __html: r.s }} />
            <Link
              href="#"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-green py-2.5 text-[11.5px] font-bold text-white transition hover:brightness-110"
            >
              {r.cta}
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </motion.article>
        ))}
      </div>
    </div>
  );
}