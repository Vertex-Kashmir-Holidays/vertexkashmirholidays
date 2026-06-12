// src/components/sections/CampaignGallery.tsx
'use client';

import { motion } from 'framer-motion';

interface CampaignGalleryProps {
  images: string[];
}

export function CampaignGallery({ images }: CampaignGalleryProps) {
  const half = Math.ceil(images.length / 2);

  const renderRow = (items: string[], reverse = false) => (
    <div className={`marquee ${reverse ? 'mt-4' : 'mt-10'}`}>
      <div className={`mq-imgs ${reverse ? 'mq-rev' : ''}`}>
        {[...items, ...items].map((seed, i) => (
          <span key={i} className="group block h-[170px] w-[250px] shrink-0 overflow-hidden rounded-2xl border border-white/10">
            <img
              src={`https://picsum.photos/seed/${seed}/540/380`}
              alt=""
              className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <section className="relative z-[2] pt-20">
      <motion.h2
        className="h-display text-center text-4xl font-bold text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Last season looked <span className="grad-accent-text italic">like this</span>
      </motion.h2>
      {renderRow(images.slice(0, half))}
      {renderRow(images.slice(half), true)}
    </section>
  );
}