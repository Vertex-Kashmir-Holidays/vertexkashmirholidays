// src/components/campaign/CampaignInclusions.tsx
'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

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
          <h2 className="text-[17px] font-bold text-foreground">What&apos;s Included</h2>
          <ul className="mt-5 space-y-3 text-[13px] text-foreground/75">
            {inclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-glow" strokeWidth={2.5} />
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
          <h2 className="text-[17px] font-bold text-foreground">Not Included</h2>
          <ul className="mt-5 space-y-3 text-[13px] text-foreground/75">
            {exclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
