// src/components/sections/TourDetailsGallery.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Images } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';

interface TourDetailsGalleryProps {
  images: string[];
}

export function TourDetailsGallery({ images }: TourDetailsGalleryProps) {
  return (
    <motion.section
      id="gallery"
      className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[17px] font-bold">Photo Gallery</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {images.slice(0, 8).map((img, i) => (
          <motion.a
            key={i}
            href="#"
            className="group relative block h-32 overflow-hidden rounded-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={imgSrc(img)}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </motion.a>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <a
          href="#"
          className="flex items-center gap-1.5 text-[13px] font-bold text-primary hover:underline"
        >
          View All Photos
          <Images className="h-4 w-4" strokeWidth={2} />
        </a>
      </div>
    </motion.section>
  );
}