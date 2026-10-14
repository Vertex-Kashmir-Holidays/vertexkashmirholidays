// src/components/adventure/AdventureGallery.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface AdventureGalleryProps {
  title: string | null;
  images: string[];
}

// One photo tile is 250px wide + the track's 1rem gap.
const TILE_PX = 266;
// One loop copy must be wider than the widest screen, or the row ends
// mid-screen with empty space after it (few photos = short track).
const MIN_COPY_PX = 2600;

export function AdventureGallery({ title, images }: AdventureGalleryProps) {
  const half = Math.ceil(images.length / 2);

  // `offset` makes the photo numbers in the alt text continuous across both
  // rows. A row's photos are repeated until one copy spans the widest screen,
  // then that copy is rendered twice so the marquee loops seamlessly; every
  // repeat is the same content, so only the first pass is announced to
  // assistive tech.
  const renderRow = (items: string[], reverse = false, offset = 0) => {
    if (items.length === 0) return null;
    const repeats = Math.max(1, Math.ceil(MIN_COPY_PX / (items.length * TILE_PX)));
    const copy = Array.from({ length: repeats }, () => items).flat();
    return (
      <div className={`marquee ${reverse ? "mt-4" : "mt-10"}`}>
        <div
          className={`mq-imgs ${reverse ? "mq-rev" : ""}`}
          // Same pace however many photos repeat (~60px/s, one copy per loop).
          style={{ animationDuration: `${Math.round((copy.length * TILE_PX) / 60)}s` }}
        >
          {[...copy, ...copy].map((src, i) => {
            const isDuplicate = i >= items.length;
            return (
              <span
                key={i}
                aria-hidden={isDuplicate || undefined}
                className="group relative block h-[170px] w-[250px] shrink-0 overflow-hidden rounded-2xl border border-border"
              >
                <Image
                  src={src}
                  alt={isDuplicate ? "" : `Adventure photo ${offset + i + 1}`}
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
  };

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
