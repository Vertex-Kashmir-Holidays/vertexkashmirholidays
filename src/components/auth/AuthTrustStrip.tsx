// src/components/sections/AuthTrustStrip.tsx
'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, Headphones, ShieldCheck, CalendarCheck } from 'lucide-react';

export function AuthTrustStrip() {
  const trustItems = [
    { t: 'Best Price Guarantee', s: 'Transparent pricing with no hidden costs.', Icon: BadgeCheck },
    { t: '24×7 Support', s: 'Real humans, real help. Always here for you.', Icon: Headphones },
    { t: 'Secure Payments', s: '100% safe & secure payments via Razorpay.', Icon: ShieldCheck },
    { t: 'Flexible Bookings', s: 'Free cancellation up to 30 days before travel.', Icon: CalendarCheck },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-6 rounded-3xl bg-card p-5 shadow-soft sm:grid-cols-2 sm:gap-7 sm:p-7 lg:grid-cols-4 lg:divide-x lg:divide-border"
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
          <item.Icon className="h-9 w-9 shrink-0 text-primary" strokeWidth={1.6} />
          <div>
            <p className="text-[14px] font-bold">{item.t}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.s}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}