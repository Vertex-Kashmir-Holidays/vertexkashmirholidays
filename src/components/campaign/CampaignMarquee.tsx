// src/components/sections/CampaignMarquee.tsx
'use client';

import { motion } from 'framer-motion';

interface CampaignMarqueeProps {
  items: string[];
}

export function CampaignMarquee({ items }: CampaignMarqueeProps) {
  return (
    <section className="relative z-[2] border-y border-white/10 bg-white/[.03] py-4 backdrop-blur">
      <div className="marquee">
        <div className="mq-track text-[13px] font-semibold tracking-wide text-white/70">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="flex items-center whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}