// src/components/sections/DestinationDetailOverview.tsx
'use client';

import { motion } from 'framer-motion';

interface DestinationDetailOverviewProps {
  description: string;
  features: {
    title: string;
    description: string;
    icon: string;
    color: string;
  }[];
}

export function DestinationDetailOverview({ description, features }: DestinationDetailOverviewProps) {
  return (
    <motion.section
      id="overview"
      className="rounded-2xl border border-brand-line bg-white p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[21px] font-bold">About Gulmarg</h2>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-brand-ink/75">
        {description}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            className="rounded-xl border border-brand-line p-4 text-center transition hover:-translate-y-0.5 hover:shadow-soft"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <span className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${feature.color}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d={feature.icon} />
              </svg>
            </span>
            <p className="mt-3 text-[13.5px] font-bold">{feature.title}</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-brand-mute">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}