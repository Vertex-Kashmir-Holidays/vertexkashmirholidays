'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PLACEHOLDER_IMAGE } from '@/lib/placeholder';

export interface LightboxImage {
  src: string;
  alt?: string;
}

interface GalleryLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function GalleryLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
}: GalleryLightboxProps) {
  const [mounted,   setMounted]   = useState(false);
  const [current,   setCurrent]   = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef  = useRef<HTMLButtonElement>(null);

  // Portal requires document — only available after mount
  useEffect(() => { setMounted(true); }, []);

  // Sync to initialIndex each time the lightbox opens
  useEffect(() => {
    if (open) {
      setCurrent(initialIndex);
      const id = setTimeout(() => closeRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open, initialIndex]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(c => (c - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(c => (c + 1) % images.length);
  }, [images.length]);

  // Keyboard: Escape / arrows / Tab focus-trap
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     { onClose(); return; }
      if (e.key === 'ArrowLeft')  { prev();    return; }
      if (e.key === 'ArrowRight') { next();    return; }

      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]),[href],[tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, prev, next]);

  // Don't render on SSR, or when closed, or when there's nothing to show
  if (!mounted || !open || images.length === 0) return null;

  const image   = images[current];
  const hasMany = images.length > 1;
  const isPlaceholder = image.src === PLACEHOLDER_IMAGE;

  const content = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo gallery, image ${current + 1} of ${images.length}`}
      // Rendered via portal at document.body — z-[99999] is safely above all
      // stacking contexts (navbar z-50, admin shell, etc.)
      className="fixed inset-0 z-[99999] flex items-center justify-center"
    >
      {/* ── Backdrop ──────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-0 bg-black/92 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* ── Image / placeholder card (z-10) ───────────────────────────── */}
      <div className="relative z-10 flex max-h-[90vh] max-w-[92vw] flex-col items-center gap-3 sm:max-w-[85vw]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={{
              enter:  (d: number) => ({ opacity: 0, x: d * 48 }),
              center: { opacity: 1, x: 0 },
              exit:   (d: number) => ({ opacity: 0, x: d * -48 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ pointerEvents: 'none' }}
          >
            {isPlaceholder ? (
              /* No-photo card shown instead of the branding placeholder SVG */
              <div className="flex h-64 w-72 flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 text-white/60 sm:h-80 sm:w-96">
                <ImageOff className="h-10 w-10" strokeWidth={1.5} />
                <p className="text-sm font-medium">No photo available</p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.src}
                alt={image.alt ?? ''}
                className="max-h-[80vh] max-w-[88vw] rounded-xl object-contain shadow-2xl sm:max-w-[80vw]"
                draggable={false}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Caption — only when alt text is set and this is a real image */}
        {!isPlaceholder && image.alt && (
          <p className="max-w-[80vw] text-center text-[13px] text-white/75">
            {image.alt}
          </p>
        )}
      </div>

      {/* ── Controls (z-20, above image layer) ────────────────────────── */}

      {/* Top bar: counter + close */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6">
        <span
          aria-live="polite"
          aria-atomic="true"
          className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white"
        >
          {current + 1} / {images.length}
        </span>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close gallery"
          className="grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Prev */}
      {hasMany && (
        <button
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 sm:left-5"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next */}
      {hasMany && (
        <button
          onClick={next}
          aria-label="Next image"
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 sm:right-5"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
