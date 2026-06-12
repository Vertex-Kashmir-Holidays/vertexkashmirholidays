// src/components/sections/CampaignInclusions.tsx
'use client';

import { motion } from 'framer-motion';

interface CampaignInclusionsProps {
  inclusions: string[];
  exclusions: string[];
}

export function CampaignInclusions({ inclusions, exclusions }: CampaignInclusionsProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[1000px] px-6 pt-20">
      <div className="grid gap-5 md:grid-cols-2">
        <motion.div
          className="glass rounded-3xl p-7"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[17px] font-bold text-white">What's Included</h2>
          <ul className="mt-5 space-y-3 text-[13px] text-white/75">
            {inclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 text-green-glow">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          className="glass rounded-3xl p-7"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-[17px] font-bold text-white">Not Included</h2>
          <ul className="mt-5 space-y-3 text-[13px] text-white/75">
            {exclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 text-rose-400">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}