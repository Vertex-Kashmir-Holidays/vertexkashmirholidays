// src/components/sections/DestinationDetailHero.tsx
'use client';

import { motion } from 'framer-motion';

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
        src={image}
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
          <a href="/" className="transition hover:text-white">Home</a>
          <span>›</span>
          <a href="/destinations" className="transition hover:text-white">Destinations</a>
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
                <div key={i} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-card">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-brand-green2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={stat.icon} />
                  </svg>
                  <div className="leading-tight">
                    <p className="text-[14px] font-extrabold">{stat.value}</p>
                    <p className="text-[10.5px] text-brand-mute">{stat.label}</p>
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
            <div className="rounded-2xl bg-white p-5 shadow-card lg:absolute lg:inset-x-0 lg:top-0">
              <h2 className="text-[19px] font-bold">Planning {name}?</h2>
              <p className="mt-1 text-[12.5px] text-brand-mute">Get expert help from our local team.</p>
              <form className="mt-4 space-y-3" id="planForm">
                <input type="hidden" name="destination_id" value={name.toLowerCase()} />
                <input type="hidden" name="destination_name" value={name} />
                <input
                  name="name"
                  required
                  className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-brand-mute/80 focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
                  placeholder="Your Name"
                />
                <div className="flex items-center overflow-hidden rounded-lg border border-brand-line transition focus-within:border-brand-green2 focus-within:ring-2 focus-within:ring-brand-green2/20">
                  <input
                    name="phone"
                    type="tel"
                    required
                    className="w-full px-3.5 py-2.5 text-[13px] outline-none placeholder:text-brand-mute/80"
                    placeholder="Phone Number"
                  />
                  <svg viewBox="0 0 24 24" className="mr-3 h-4 w-4 shrink-0 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
                  </svg>
                </div>
                <div className="flex items-center overflow-hidden rounded-lg border border-brand-line transition focus-within:border-brand-green2 focus-within:ring-2 focus-within:ring-brand-green2/20">
                  <input
                    name="travel_date"
                    className="w-full px-3.5 py-2.5 text-[13px] outline-none placeholder:text-brand-mute/80"
                    placeholder="Travel Date"
                    onFocus={(e) => (e.target.type = 'date')}
                  />
                  <svg viewBox="0 0 24 24" className="mr-3 h-4 w-4 shrink-0 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div className="relative">
                  <select
                    name="travellers"
                    className="w-full appearance-none rounded-lg border border-brand-line bg-white px-3.5 py-2.5 text-[13px] text-brand-mute outline-none transition focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
                  >
                    <option value="" selected>No. of Travellers</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                    <option>6+</option>
                  </select>
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <motion.button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-green py-3 text-[13.5px] font-bold text-white shadow-card transition hover:brightness-110"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  Get a Free Itinerary ⚡
                </motion.button>
              </form>
              <a href="#" className="mt-3.5 flex items-center justify-center gap-2 text-[13px] font-bold text-brand-green2 transition hover:underline">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z" />
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}