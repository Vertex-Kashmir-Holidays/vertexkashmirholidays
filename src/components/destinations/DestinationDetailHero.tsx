// src/components/sections/DestinationDetailHero.tsx
'use client';

import { motion } from 'framer-motion';
import { imgSrc } from '@/lib/placeholder';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';
import { Thermometer } from 'lucide-react';
import Link from 'next/link';
import type { LiveWeather } from '@/lib/weather';

interface DestinationDetailHeroProps {
  name: string;
  tagline: string;
  description: string;
  region: string;
  image: string;
  stats: {
    value: string;
    label: string;
    icon: string;
  }[];
  weather?: LiveWeather | null;
}

export function DestinationDetailHero({
  name,
  tagline,
  description,
  region,
  image,
  stats,
  weather,
}: DestinationDetailHeroProps) {
  return (
    <section className="relative bg-brand-dark">
      <motion.img
        src={imgSrc(image)}
        alt={name}
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/35 to-brand-dark/10"></div>
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent"></div>

      <div className="relative z-10 mx-auto max-w-[1300px] px-6 pb-24 pt-28">
        <nav className="flex items-center gap-2 text-[12.5px] text-white/85" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <span>›</span>
          <Link href="/destinations" className="transition hover:text-white">Destinations</Link>
          <span>›</span>
          <span className="font-semibold text-white">{name}</span>
        </nav>

        <div className="grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-[1.1fr_minmax(0,420px)]">
          <div className="max-w-xl">
            <motion.span
              className="rounded-md bg-badge-green px-3 py-1.5 text-[10.5px] font-extrabold tracking-wide text-white shadow"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {region}
            </motion.span>
            <motion.h1
              className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-[64px] lg:leading-none"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {name}
            </motion.h1>
            <motion.p
              className="mt-2 text-xl font-bold text-white sm:text-2xl lg:text-[30px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {tagline}
            </motion.p>
            <motion.p
              className="mt-5 max-w-sm text-[14px] leading-relaxed text-white/85"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {description}
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Live weather chip — shown first when coordinates are available */}
              {weather && (
                <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-card">
                  <Thermometer className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.8} />
                  <div className="leading-tight">
                    <p className="text-[14px] font-extrabold">{weather.temperature}°C</p>
                    <p className="text-[10.5px] text-muted-foreground">{weather.condition}</p>
                  </div>
                </div>
              )}
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-card">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={stat.icon} />
                  </svg>
                  <div className="leading-tight">
                    <p className="text-[14px] font-extrabold">{stat.value}</p>
                    <p className="text-[10.5px] text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <HeroLeadCard source="destination-detail" context={{ destinationName: name }} />
        </div>
      </div>
    </section>
  );
}