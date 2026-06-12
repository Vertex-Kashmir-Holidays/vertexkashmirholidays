// src/components/sections/TourDetailsGallery.tsx
'use client';

import { motion } from 'framer-motion';

interface TourDetailsGalleryProps {
  images: string[];
}

export function TourDetailsGallery({ images }: TourDetailsGalleryProps) {
  return (
    <motion.section
      id="gallery"
      className="mt-6 rounded-2xl border border-brand-line bg-white p-6 shadow-soft"
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
            className="group block overflow-hidden rounded-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={img}
              alt=""
              className="h-32 w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </motion.a>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <a
          href="#"
          className="flex items-center gap-1.5 text-[13px] font-bold text-brand-green2 hover:underline"
        >
          View All Photos
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.8-3.8a2 2 0 0 0-2.8 0L6 20" />
          </svg>
        </a>
      </div>
    </motion.section>
  );
}