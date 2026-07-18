// src/components/campaign/CampaignGallery.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface CampaignGalleryProps {
  title: string | null;
  images: string[];
}

export function CampaignGallery({ title, images }: CampaignGalleryProps) {
  const half = Math.ceil(images.length / 2);

  const renderRow = (items: string[], reverse = false) => (
    <div className={`marquee ${reverse ? 'mt-4' : 'mt-10'}`}>
      <div className={`mq-imgs ${reverse ? 'mq-rev' : ''}`}>
        {[...items, ...items].map((src, i) => (
          <span key={i} className="group relative block h-[170px] w-[250px] shrink-0 overflow-hidden rounded-2xl border border-border">
            <Image src={src} alt="" fill sizes="250px" className="object-cover transition duration-700 group-hover:scale-110" />
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <section className="relative z-[2] pt-20">
      {title && (
        <motion.h2
          className="h-display px-6 text-center text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
      )}
      {renderRow(images.slice(0, half))}
      {renderRow(images.slice(half), true)}
    </section>
  );
}
