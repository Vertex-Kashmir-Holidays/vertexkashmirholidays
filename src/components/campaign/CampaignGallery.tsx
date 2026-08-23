// src/components/campaign/CampaignGallery.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface CampaignGalleryProps {
  title: string | null;
  images: string[];
}

export function CampaignGallery({ title, images }: CampaignGalleryProps) {
  const half = Math.ceil(images.length / 2);

  // `offset` makes the photo numbers in the alt text continuous across both
  // rows. The row's images are rendered twice to make the marquee loop
  // seamlessly; the second copy is the same content, so it's hidden from
  // assistive tech rather than announced again.
  const renderRow = (items: string[], reverse = false, offset = 0) => (
    <div className={`marquee ${reverse ? "mt-4" : "mt-10"}`}>
      <div className={`mq-imgs ${reverse ? "mq-rev" : ""}`}>
        {[...items, ...items].map((src, i) => {
          const isDuplicate = i >= items.length;
          return (
            <span
              key={i}
              aria-hidden={isDuplicate || undefined}
              className="group relative block h-[170px] w-[250px] shrink-0 overflow-hidden rounded-2xl border border-border"
            >
              <Image
                src={src}
                alt={isDuplicate ? "" : `Campaign photo ${offset + i + 1}`}
                fill
                sizes="250px"
                className="object-cover transition duration-700 group-hover:scale-110"
              />
            </span>
          );
        })}
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
      {renderRow(images.slice(half), true, half)}
    </section>
  );
}
