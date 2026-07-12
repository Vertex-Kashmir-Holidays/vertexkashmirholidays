// src/components/sections/DestinationDetailHero.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { imgSrc } from '@/lib/placeholder';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';
import { Thermometer } from 'lucide-react';
import Link from 'next/link';
import type { LiveWeather } from '@/lib/weather';

interface DestinationDetailHeroProps {
  name: string;
  tagline: string;
  region: string;
  image: string;
  imageMobile?: string | null;
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
  region,
  image,
  imageMobile,
  stats,
  weather,
}: DestinationDetailHeroProps) {
  return (
    <section className="relative bg-brand-dark">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {imageMobile ? (
          <>
            <Image src={imgSrc(imageMobile)} alt={name} fill priority sizes="100vw" className="object-cover sm:hidden" />
            <Image src={imgSrc(image)} alt={name} fill sizes="100vw" className="hidden object-cover sm:block" />
          </>
        ) : (
          <Image src={imgSrc(image)} alt={name} fill priority sizes="100vw" className="object-cover" />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/35 to-brand-dark/10"></div>
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent"></div>

      <div className="relative z-10 mx-auto max-w-[1300px] px-6 pb-24 pt-28">
        <nav className="flex items-center gap-2 text-[14px] text-white/85" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <span>›</span>
          <Link href="/destinations" className="transition hover:text-white">Destinations</Link>
          <span>›</span>
          <span className="font-semibold text-white">{name}</span>
        </nav>

        <div className="grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-[1.1fr_minmax(0,420px)]">
          <div className="max-w-xl">
            <span
              className="hero-reveal-x rounded-md bg-badge-green px-3 py-1.5 text-[12px] font-extrabold tracking-wide text-white shadow"
              style={{ '--hr-duration': '0.5s' } as React.CSSProperties}
            >
              {region}
            </span>
            <h1
              className="hero-reveal mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-[64px] lg:leading-none"
              style={{ '--hr-y': '20px', '--hr-delay': '0.1s' } as React.CSSProperties}
            >
              {name}
            </h1>
            <p
              className="hero-reveal mt-2 text-xl font-bold text-white sm:text-2xl lg:text-[30px]"
              style={{ '--hr-delay': '0.2s' } as React.CSSProperties}
            >
              {tagline}
            </p>

            <div
              className="hero-reveal mt-8 flex flex-wrap gap-3"
              style={{ '--hr-y': '20px', '--hr-delay': '0.4s' } as React.CSSProperties}
            >
              {/* Live weather chip — shown first when coordinates are available */}
              {weather && (
                <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-card">
                  <Thermometer className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.8} />
                  <div className="leading-tight">
                    <p className="text-[16px] font-extrabold">{weather.temperature}°C</p>
                    <p className="text-[12px] text-muted-foreground">{weather.condition}</p>
                  </div>
                </div>
              )}
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-card">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={stat.icon} />
                  </svg>
                  <div className="leading-tight">
                    <p className="text-[16px] font-extrabold">{stat.value}</p>
                    <p className="text-[12px] text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <HeroLeadCard source="destination-detail" context={{ destinationName: name }} />
        </div>
      </div>
    </section>
  );
}