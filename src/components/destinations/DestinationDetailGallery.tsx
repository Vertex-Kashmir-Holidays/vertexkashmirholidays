// src/components/sections/DestinationDetailGallery.tsx
"use client";

import { GalleryLightbox } from "@/components/ui/organisms/GalleryLightbox";
import { imgSrc } from "@/lib/placeholder";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface DestinationDetailGalleryProps {
  name: string;
  images: string[];
}

// Same 3-visible carousel mechanics as ActivitiesShowcase / DestinationNearby.
// Clicking a thumbnail still opens the full GalleryLightbox at that image.
export function DestinationDetailGallery({ name, images }: DestinationDetailGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const lightboxImages = images.map((src) => ({ src: imgSrc(src), alt: name }));

  if (images.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + itemsPerView >= images.length ? 0 : prev + itemsPerView));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev - itemsPerView < 0 ? Math.max(0, images.length - itemsPerView) : prev - itemsPerView,
    );
  };

  const visibleImages = images.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <>
      <motion.section
        id="gallery"
        className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold">Glimpses of {name}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpenIndex(0)}
              className="text-[14px] font-bold text-primary hover:underline"
            >
              View full gallery ›
            </button>
            {images.length > itemsPerView && (
              <div className="flex gap-2">
                <motion.button
                  onClick={prevSlide}
                  aria-label="Previous"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                </motion.button>
                <motion.button
                  onClick={nextSlide}
                  aria-label="Next"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                </motion.button>
              </div>
            )}
          </div>
        </div>

        <div className="relative mt-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {visibleImages.map((image, i) => {
                const absoluteIndex = currentIndex + i;
                return (
                  <button
                    key={absoluteIndex}
                    onClick={() => setOpenIndex(absoluteIndex)}
                    className="group relative block h-[140px] w-full overflow-hidden rounded-xl"
                  >
                    <Image
                      src={imgSrc(image)}
                      alt={`${name} — photo ${absoluteIndex + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20" />
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {images.length > itemsPerView && (
            <div className="mt-6 flex justify-center gap-1.5">
              {Array.from({ length: Math.ceil(images.length / itemsPerView) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i * itemsPerView)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === Math.floor(currentIndex / itemsPerView)
                      ? "w-4 bg-primary"
                      : "w-1.5 bg-border"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
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
