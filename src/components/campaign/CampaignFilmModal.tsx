// src/components/sections/CampaignFilmModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface CampaignFilmModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  poster: string;
}

export function CampaignFilmModal({ isOpen, onClose, src, poster }: CampaignFilmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/85 p-5 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <div className="relative w-full max-w-4xl mx-auto">
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black shadow-glass">
                <video
                  className="aspect-video w-full"
                  controls
                  preload="none"
                  poster={poster}
                >
                  <source src={src} type="video/mp4" />
                </video>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}