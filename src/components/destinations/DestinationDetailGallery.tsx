// src/components/sections/DestinationDetailGallery.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { imgSrc } from '@/lib/placeholder';
import { GalleryLightbox } from '@/components/ui/GalleryLightbox';

interface DestinationDetailGalleryProps {
  name: string;
  images: string[];
}

export function DestinationDetailGallery({ name, images }: DestinationDetailGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const lightboxImages = images.map(src => ({ src: imgSrc(src), alt: name }));

  return (
    <>
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
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => setOpenIndex(0)}
              className="flex items-center gap-1 text-[13px] font-bold text-primary hover:underline focus:outline-none focus:underline"
            >
              View full gallery ›
            </button>
          )}
        </div>
        <div
          className="snap-row scrollbar-none mt-5 flex gap-4 overflow-x-auto pb-1"
          id="glimpseRow"
        >
          {images.map((image, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group relative block h-[120px] w-[176px] shrink-0 overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              aria-label={`Open gallery at photo ${i + 1}`}
            >
              <Image
                src={imgSrc(image)}
                alt={`${name} — photo ${i + 1}`}
                fill
                sizes="176px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />
            </motion.button>
          ))}
        </div>
      </motion.section>

      <GalleryLightbox
        images={lightboxImages}
        initialIndex={openIndex ?? 0}
        open={openIndex !== null}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}
