// src/components/sections/DestinationDetailHero.tsx
'use client';

import { motion } from 'framer-motion';
import { Phone, Calendar, ChevronDown, FileText, Zap } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';
import { WhatsAppIcon } from '@/components/icons/brand';
import Link from 'next/link';

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
}

export function DestinationDetailHero({
  name,
  tagline,
  description,
  region,
  image,
  stats,
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

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
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
              className="mt-4 text-[56px] font-extrabold leading-none text-white lg:text-[64px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {name}
            </motion.h1>
            <motion.p
              className="mt-2 text-[26px] font-bold text-white lg:text-[30px]"
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

          {/* Planning Form */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-2xl bg-card p-5 shadow-card lg:absolute lg:inset-x-0 lg:top-0">
              <h2 className="text-[19px] font-bold">Planning {name}?</h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">Get expert help from our local team.</p>
              <form className="mt-4 space-y-3" id="planForm">
                <input type="hidden" name="destination_id" value={name.toLowerCase()} />
                <input type="hidden" name="destination_name" value={name} />
                <input
                  name="name"
                  required
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Your Name"
                />
                <div className="flex items-center overflow-hidden rounded-lg border border-border transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <input
                    name="phone"
                    type="tel"
                    required
                    className="w-full px-3.5 py-2.5 text-[13px] outline-none placeholder:text-muted-foreground/80"
                    placeholder="Phone Number"
                  />
                  <Phone className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                </div>
                <div className="flex items-center overflow-hidden rounded-lg border border-border transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <input
                    name="travel_date"
                    className="w-full px-3.5 py-2.5 text-[13px] outline-none placeholder:text-muted-foreground/80"
                    placeholder="Travel Date"
                    onFocus={(e) => (e.target.type = 'date')}
                  />
                  <Calendar className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                </div>
                <div className="relative">
                  <select
                    name="travellers"
                    defaultValue=""
                    className="w-full appearance-none rounded-lg border border-border bg-card px-3.5 py-2.5 text-[13px] text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">No. of Travellers</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                    <option>6+</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={2.4} />
                </div>
                <motion.button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-card transition hover:brightness-110"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileText className="h-4 w-4" strokeWidth={2} />
                  Get a Free Itinerary
                  <Zap className="h-4 w-4 fill-current" strokeWidth={2} />
                </motion.button>
              </form>
              <a href="#" className="mt-3.5 flex items-center justify-center gap-2 text-[13px] font-bold text-primary transition hover:underline">
                <WhatsAppIcon className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}