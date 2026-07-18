// src/components/campaign/CampaignItinerary.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { imgSrc } from '@/lib/placeholder';
import type { CampaignItineraryItem } from '@/types/campaign';

interface CampaignItineraryProps {
  title: string | null;
  itinerary: CampaignItineraryItem[];
}

export function CampaignItinerary({ title, itinerary }: CampaignItineraryProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[980px] px-6 pt-20" id="itinerary">
      <div className="text-center">
        <motion.p
          className="text-[12px] font-extrabold tracking-[0.24em] text-camp-accent"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          THE PLAN
        </motion.p>
        <motion.h2
          className="h-display mt-3 text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {title}
        </motion.h2>
      </div>
      <div className="relative mt-12">
        <span className="tl-line absolute left-[22px] bottom-2 top-2 w-[3px] rounded-full opacity-60 lg:left-1/2 lg:-translate-x-1/2"></span>
        <div className="space-y-10">
          {itinerary.map((item, i) => (
            <motion.div
              key={i}
              className="relative grid items-center gap-5 pl-14 lg:grid-cols-2 lg:gap-12 lg:pl-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.07 }}
            >
              <span className="absolute left-0 top-1 z-10 grid h-11 w-11 place-items-center rounded-full bg-accent-grad text-[16px] font-extrabold text-white ring-inner shadow-glow lg:left-1/2 lg:-translate-x-1/2">
                {i + 1}
              </span>
              <div className={`${i % 2 ? 'lg:order-2 lg:pl-14' : 'lg:pr-14 lg:text-right'}`}>
                <h3 className="text-[18px] font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
              <div className={`${i % 2 ? 'lg:order-1 lg:pr-14' : 'lg:pl-14'}`}>
                <div className="group relative h-[150px] overflow-hidden rounded-2xl border border-border shadow-card lg:h-[170px]">
                  <Image
                    src={imgSrc(item.image)}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 460px"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
