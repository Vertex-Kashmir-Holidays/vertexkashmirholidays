// src/components/campaign/CampaignFilm.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface CampaignFilmProps {
  poster: string;
  title: string | null;
  dur: string | null;
  onFilmClick: () => void;
}

export function CampaignFilm({ poster, title, dur, onFilmClick }: CampaignFilmProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-20">
      <motion.button
        onClick={onFilmClick}
        className="group relative block h-[300px] w-full overflow-hidden rounded-[2rem] border border-border shadow-card lg:h-[440px]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Image
          src={poster}
          alt="Campaign film"
          fill
          sizes="(max-width: 1300px) 100vw, 1300px"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30"></span>
        <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[hsl(202_50%_8%)] shadow-card transition duration-300 group-hover:scale-110">
          <span className="ml-1 text-xl">▶</span>
        </span>
        <span className="absolute bottom-6 left-7 text-left">
          <span className="block text-[12px] font-extrabold tracking-[0.22em] text-white/70">
            THE FILM
          </span>
          {title && (
            <span className="h-display mt-1 block text-2xl font-bold text-white">{title}</span>
          )}
        </span>
        {dur && (
          <span className="absolute bottom-6 right-7 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[14px] font-bold text-white backdrop-blur-xl">
            ▶ {dur}
          </span>
        )}
      </motion.button>
    </section>
  );
}
