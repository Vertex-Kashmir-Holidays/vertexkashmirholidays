// src/components/campaign/CampaignStats.tsx
"use client";

import { motion } from "framer-motion";

interface CampaignStatsProps {
  stats: Array<[string, string, string]>;
}

export function CampaignStats({ stats }: CampaignStatsProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-16">
      <motion.div
        className="glass grid grid-cols-2 gap-y-7 rounded-3xl px-6 py-8 text-center sm:grid-cols-4 sm:divide-x sm:divide-border"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {stats.map(([value, suffix, label], i) => (
          <div key={i} className="px-3">
            <p className="text-[26px] font-extrabold text-foreground">
              {value}
              <span className="grad-accent-text">{suffix}</span>
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
