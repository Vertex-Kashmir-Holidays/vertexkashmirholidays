// src/components/sections/AuthTrustStrip.tsx
'use client';

import { motion } from 'framer-motion';

export function AuthTrustStrip() {
  const trustItems = [
    {
      t: 'Best Price Guarantee',
      s: 'Transparent pricing with no hidden costs.',
      icon: 'm12 2 2.4 2.4 3.3-.5.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.5L12 22l-2.4-2.4-3.3.5-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.5ZM9 12l2 2 4-4',
    },
    {
      t: '24×7 Support',
      s: 'Real humans, real help. Always here for you.',
      icon: 'M3 12a9 9 0 1 1 18 0v5a2 2 0 0 1-2 2h-3v-6h5M3 12v5a2 2 0 0 0 2 2h3v-6H3',
    },
    {
      t: 'Secure Payments',
      s: '100% safe & secure payments via Razorpay.',
      icon: 'M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3ZM9 12l2 2 4-4',
    },
    {
      t: 'Flexible Bookings',
      s: 'Free cancellation up to 30 days before travel.',
      icon: 'M3 4h18v18H3ZM16 2v4M8 2v4M3 10h18M9 16l2 2 4-4',
    },
  ];

  return (
    <motion.div
      className="grid gap-7 rounded-3xl bg-card p-7 shadow-soft sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {trustItems.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3.5 lg:px-5 lg:first:pl-0 lg:last:pr-0"
        >
          <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={item.icon} />
          </svg>
          <div>
            <p className="text-[13.5px] font-bold">{item.t}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{item.s}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}