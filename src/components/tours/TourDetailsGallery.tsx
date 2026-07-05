// src/components/sections/TourDetailsGallery.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Images } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';
import { GalleryLightbox } from '@/components/ui/GalleryLightbox';

interface GalleryItem {
  url: string;
  alt: string;
}

interface TourDetailsGalleryProps {
  images: GalleryItem[];
}

export function TourDetailsGallery({ images }: TourDetailsGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const lightboxImages = images.map((item) => ({ src: imgSrc(item.url), alt: item.alt || undefined }));
  const gridImages = images.slice(0, 8);

  return (
    <>
      <motion.section
        id="gallery"
        className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-[17px] font-bold">Photo Gallery</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {gridImages.map((item, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group relative block h-32 w-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              aria-label={item.alt || `Open gallery at photo ${i + 1}`}
            >
              <Image
                src={imgSrc(item.url)}
                alt={item.alt || `Gallery photo ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              {/* Hover overlay hint */}
              <span className="absolute inset-0 grid place-items-center bg-black/0 transition duration-300 group-hover:bg-black/30">
                <Images className="h-5 w-5 text-white opacity-0 drop-shadow transition duration-300 group-hover:opacity-100" />
              </span>
            </motion.button>
          ))}
        </div>
        {images.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setOpenIndex(0)}
              className="flex items-center gap-1.5 text-[13px] font-bold text-primary hover:underline focus:outline-none focus:underline"
            >
              View All Photos
              <Images className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        )}
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
