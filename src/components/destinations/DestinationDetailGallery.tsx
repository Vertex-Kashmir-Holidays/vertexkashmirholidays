// src/components/sections/DestinationDetailGallery.tsx
'use client';

import { motion } from 'framer-motion';

interface DestinationDetailGalleryProps {
  name: string;
  images: string[];
}

export function DestinationDetailGallery({ name, images }: DestinationDetailGalleryProps) {
  return (
    <motion.section
      id="gallery"
      className="rounded-2xl border border-border bg-card p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[21px] font-bold">Glimpses of {name}</h2>
        <a href="#" className="flex items-center gap-1 text-[13px] font-bold text-primary hover:underline">
          View full gallery ›
        </a>
      </div>
      <div className="snap-row scrollbar-none mt-5 flex gap-4 overflow-x-auto pb-1" id="glimpseRow">
        {images.map((image, i) => (
          <motion.a
            key={i}
            href="#"
            className="group block h-[120px] w-[176px] shrink-0 overflow-hidden rounded-xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </motion.a>
        ))}
      </div>
    </motion.section>
  );
}