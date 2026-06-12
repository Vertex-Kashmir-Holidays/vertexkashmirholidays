// src/components/sections/CampaignPricing.tsx
'use client';

import { motion } from 'framer-motion';
import { Tilt3D } from '@/components/ui/3DTilt';
import Link from 'next/link';

interface PricingTier {
  name: string;
  price: string;
  old?: string;
  tag?: string;
  desc: string;
  feats: string[];
}

interface CampaignPricingProps {
  tiers: PricingTier[];
}

export function CampaignPricing({ tiers }: CampaignPricingProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-20" id="pricing">
      <div className="text-center">
        <motion.p
          className="text-[11px] font-extrabold tracking-[0.24em] text-accent"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          SIMPLE PRICING
        </motion.p>
        <motion.h2
          className="h-display mt-3 text-4xl font-bold text-white"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Pick how you want to travel
        </motion.h2>
        <motion.p
          className="mt-3 text-[13px] text-white/55"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Lock your seat with just 20% advance · Balance 7 days before departure
        </motion.p>
      </div>
      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
        {tiers.map((tier, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Tilt3D intensity={6}>
              <div
                className={`relative flex flex-col rounded-3xl p-7 ${
                  tier.tag === 'MOST POPULAR' ? 'glass-strong shadow-glow' : 'glass shadow-card'
                }`}
                style={tier.tag === 'MOST POPULAR' ? { border: '1.5px solid var(--accent)' } : {}}
              >
                <div className="shine"></div>
                <div className="flex h-full flex-col">
                  {tier.tag && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-grad px-4 py-1.5 text-[10px] font-extrabold tracking-wide text-white ring-inner">
                      {tier.tag}
                    </span>
                  )}
                  <h3 className="text-[17px] font-bold text-white">{tier.name}</h3>
                  <p className="mt-1 text-[12px] text-white/55">{tier.desc}</p>
                  <p className="mt-5 flex items-baseline gap-2">
                    <span className="text-[30px] font-extrabold text-white">{tier.price}</span>
                    {tier.old && <span className="text-[13px] text-white/40 line-through">{tier.old}</span>}
                    <span className="text-[11px] text-white/45">/person</span>
                  </p>
                  <ul className="mt-5 flex-1 space-y-2.5 text-[12.5px] text-white/75">
                    {tier.feats.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-green-glow">✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="#reserve"
                    className={`${
                      tier.tag === 'MOST POPULAR'
                        ? 'sweep bg-accent-grad text-white ring-inner shadow-glow'
                        : 'glass text-white hover:bg-white/15'
                    } mt-7 rounded-xl py-3 text-center text-[13px] font-extrabold transition hover:scale-[1.02]`}
                  >
                    Choose {tier.name}
                  </Link>
                </div>
              </div>
            </Tilt3D>
          </motion.div>
        ))}
      </div>
    </section>
  );
}