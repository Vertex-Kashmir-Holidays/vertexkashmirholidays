// src/components/sections/DestinationDetailOverview.tsx
'use client';

import { motion } from 'framer-motion';

interface DestinationDetailOverviewProps {
  name: string;
  description: string;
  features?: {
    title: string;
    description: string;
    icon: string;
    color: string;
  }[];
}

export function DestinationDetailOverview({ name, description, features = [] }: DestinationDetailOverviewProps) {
  return (
    <motion.section
      id="overview"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[17px] font-bold">About {name}</h2>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-foreground/75">
        {description}
      </p>
      {features.length > 0 && (
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            className="rounded-xl border border-border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-soft"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${feature.color}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d={feature.icon} />
              </svg>
            </span>
            <p className="mt-3 text-[13.5px] font-bold">{feature.title}</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
      )}
    </motion.section>
  );
}