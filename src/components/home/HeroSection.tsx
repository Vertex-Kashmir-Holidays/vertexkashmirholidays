// src/components/sections/HeroSection.tsx
'use client';

import { Tilt3D } from '@/components/ui/3DTilt';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formPulse, setFormPulse] = useState(false);
  const [progress, setProgress] = useState(0);
  const embersRef = useRef<HTMLDivElement>(null);
  const flakesRef = useRef<HTMLDivElement>(null);

  // Image rotation
  const backgroundImages = [
    '/hero/hero.webp',
    '/hero/gulmarg.webp',
    '/hero/srinagar.webp',
    '/hero/pahalgam.webp',
    '/hero/sonamarg.webp',
    '/hero/gurez.webp',
    '/hero/shikara.webp',
  ];

  useEffect(() => {
    // Rotate background every 10 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Form pulse effect - subtle attention grabber
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setFormPulse(true);
      setTimeout(() => setFormPulse(false), 1500);
    }, 8000);

    return () => clearInterval(pulseInterval);
  }, []);

  // Slower clockwise animation - starts from right side
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev + 1) % 100);
    }, 180); // ~18 seconds for full rotation

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Particles
    const createParticles = (container: HTMLDivElement, className: string, count: number, isEmber: boolean) => {
      for (let i = 0; i < count; i++) {
        const el = document.createElement('i');
        el.className = className;
        const z = Math.random();
        if (isEmber) {
          el.style.cssText += `left:${Math.random() * 100}%;bottom:${Math.random() * 30}%;width:${2 + Math.random() * 3}px;height:${2 + Math.random() * 3}px;animation-duration:${5 + Math.random() * 6}s;animation-delay:-${Math.random() * 6}s`;
        } else {
          el.style.cssText += `left:${Math.random() * 100}%;top:${-Math.random() * 20}%;width:${2 + z * 3}px;height:${2 + z * 3}px;opacity:${0.3 + z * 0.5};animation-duration:${9 + Math.random() * 10}s;animation-delay:-${Math.random() * 12}s`;
        }
        container.appendChild(el);
      }
    };

    if (embersRef.current) createParticles(embersRef.current, 'ember', 16, true);
    if (flakesRef.current) createParticles(flakesRef.current, 'flake', 26, false);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const gradientValue = `conic-gradient(
    from 270deg at 50% 50%,
    transparent 0%,
    transparent ${progress}%,
    hsl(150 90% 60%) ${progress}%,
    hsl(160 90% 60%) ${progress + 15}%,
    hsl(170 90% 55%) ${progress + 30}%,
    transparent ${progress + 35}%,
    transparent 100%
  )`;


  return (
    <section className="relative z-[2] min-h-[100svh] overflow-hidden bg-grain">
      {/* Background - Rotating hero images */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={backgroundImages[currentImageIndex]}
            alt="Kashmir landscape"
            className="h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-dark-bg to-transparent"></div>
        
        {/* Particles */}
        <div id="embers" ref={embersRef} className="absolute inset-y-0 left-0 w-1/2"></div>
        <div id="flakes" ref={flakesRef} className="absolute inset-y-0 right-0 w-1/2"></div>
      </div>

      {/* Image indicator dots */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
            }`}
            aria-label={`Switch to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-[2] mx-auto grid min-h-[100svh] max-w-[1300px] items-center gap-10 px-6 pb-20 pt-32 lg:grid-cols-[1.15fr_.85fr]">
        <motion.div
          data-depth
          style={{ '--d': '0.7' } as any}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-bold tracking-[0.22em] text-green-glow"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-glow"></span> MONSOON-READY KASHMIR TRIPS · 2026
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="h-display text-[46px] font-extrabold text-white sm:text-[64px]"
          >
            While the plains<br />
            <span className="grad-text-warm italic">scorch,</span> Kashmir is
            <span className="grad-text-cool">calling.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-white/70"
          >
            Curated Kashmir holidays — handcrafted by locals, priced for honest travellers. Step through to 18°C.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="#packages"
              className="inline-flex items-center gap-2 rounded-full bg-green-bright px-7 py-3.5 text-sm font-bold text-navy-brand shadow-glow ring-inner transition hover:scale-[1.03] hover:brightness-110"
            >
              Explore Packages
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link href="#" className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-white/15">
              ▶&nbsp; Watch Film
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-10 grid max-w-md grid-cols-4 divide-x divide-white/10 rounded-2xl glass py-4 text-center"
          >
            <div>
              <p className="text-lg font-extrabold text-white" data-count="12000" data-suffix="+">0</p>
              <p className="mt-1 text-[10px] text-white/55">Travellers</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white" data-count="500" data-suffix="+">0</p>
              <p className="mt-1 text-[10px] text-white/55">Curated Trips</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white" data-count="15" data-suffix="+">0</p>
              <p className="mt-1 text-[10px] text-white/55">Years</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">4.9★</p>
              <p className="mt-1 text-[10px] text-white/55">Rating</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Form with golden portal border only - everything else stays green */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: .9, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Tilt3D intensity={8}>
            <motion.div
              className="glass-deep relative rounded-3xl p-6 shadow-glass overflow-hidden"
              style={{
                position: 'relative',
                borderRadius: '24px',
              }}
            >
              {/* Primary golden portal border */}
              <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  border: '6px solid transparent',
                  borderRadius: '24px',
                  backgroundImage: gradientValue,
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
                animate={{
                  backgroundImage: gradientValue,
                }}
                transition={{
                  duration: 0.01,
                }}
              />
              
              {/* Secondary golden glow layer - thicker and brighter */}
              <motion.div
                className="absolute -inset-1 rounded-3xl pointer-events-none"
                style={{
                  border: '10px solid transparent',
                  borderRadius: '28px',
                  backgroundImage: gradientValue,
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  filter: 'blur(6px)',
                  opacity: 0.7,
                }}
                animate={{
                  backgroundImage: gradientValue,
                }}
                transition={{
                  duration: 0.01,
                }}
              />

              {/* Golden glow pulse around the form */}
              <motion.div
                className="absolute -inset-2 rounded-3xl bg-green-brand/20 blur-2xl"
                animate={{
                  opacity: formPulse ? 0.8 : 0.3,
                  scale: formPulse ? 1.05 : 1,
                }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
              
              <div className="shine"></div>
              <div className="pop relative z-10">
                <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-green-glow">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-glow"></span> PLAN YOUR KASHMIR TRIP
                </p>
                
                <h3 className="h-display mt-3 text-[26px] font-bold text-white">Get a quote in 60 seconds</h3>
                <p className="mt-1 text-[13px] text-white/60">Free, no spam — real human on WhatsApp.</p>
                
                <div className="mt-5 space-y-3 text-sm">
                  <input
                    className="w-full rounded-xl border border-white/12 bg-white/[.06] px-4 py-3 text-white placeholder-white/45 outline-none ring-green-bright/60 transition focus:bg-white/10 focus:ring-2"
                    placeholder="Full Name *"
                  />
                  <input
                    className="w-full rounded-xl border border-white/12 bg-white/[.06] px-4 py-3 text-white placeholder-white/45 outline-none ring-green-bright/60 transition focus:bg-white/10 focus:ring-2"
                    placeholder="Phone *"
                  />
                  <input
                    className="w-full rounded-xl border border-white/12 bg-white/[.06] px-4 py-3 text-white placeholder-white/45 outline-none ring-green-bright/60 transition focus:bg-white/10 focus:ring-2"
                    placeholder="Email"
                  />
                  {/* <div className="grid grid-cols-2 gap-3">
                    <input
                      className="w-full rounded-xl border border-white/12 bg-white/[.06] px-4 py-3 text-white placeholder-white/45 outline-none ring-green-bright/60 transition focus:bg-white/10 focus:ring-2"
                      placeholder="Start Date"
                    />
                    <input
                      className="w-full rounded-xl border border-white/12 bg-white/[.06] px-4 py-3 text-white placeholder-white/45 outline-none ring-green-bright/60 transition focus:bg-white/10 focus:ring-2"
                      placeholder="Travellers"
                    />
                  </div> */}
                  <button className="sweep w-full rounded-xl bg-green-bright py-3.5 text-sm font-bold text-navy-brand shadow-glow ring-inner transition hover:brightness-110">
                    Request Free Itinerary →
                  </button>
                </div>
                
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <img className="h-7 w-7 rounded-full border-2 border-navy-brand object-cover" src="https://picsum.photos/seed/p1/60" alt="" />
                    <img className="h-7 w-7 rounded-full border-2 border-navy-brand object-cover" src="https://picsum.photos/seed/p2/60" alt="" />
                    <img className="h-7 w-7 rounded-full border-2 border-navy-brand object-cover" src="https://picsum.photos/seed/p3/60" alt="" />
                  </div>
                  <p className="text-[11px] text-white/55">12,248+ planned their trip this month</p>
                </div>
              </div>
            </motion.div>
          </Tilt3D>
        </motion.div>
      </div>
    </section>
  );
}