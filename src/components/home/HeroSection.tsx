// src/components/sections/HeroSection.tsx
'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Tilt3D } from '@/components/ui/3DTilt';
import { renderAccents } from '@/lib/accents';
import type { HeroContentData, HeroSlideData, SiteStatData } from '@/types/home';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface HeroSectionProps {
  content: HeroContentData;
  slides: HeroSlideData[];
  stats: SiteStatData[];
}

export function HeroSection({ content, slides, stats }: HeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formPulse, setFormPulse] = useState(false);
  const embersRef = useRef<HTMLDivElement>(null);
  const flakesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slides.length < 2) return;

    // Rotate background every 10 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slides.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [slides.length]);

  // Form pulse effect - subtle attention grabber
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setFormPulse(true);
      setTimeout(() => setFormPulse(false), 1500);
    }, 8000);

    return () => clearInterval(pulseInterval);
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

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const currentSlide = slides[currentImageIndex];

  return (
    <section className="relative z-[2] min-h-[100svh] overflow-hidden bg-grain">
      {/* Background - Rotating hero images */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          {currentSlide && (
            <motion.div
              key={currentImageIndex}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <picture className="block h-full w-full">
                {currentSlide.imageMobile && (
                  <source
                    media="(max-width: 640px)"
                    srcSet={currentSlide.imageMobile}
                  />
                )}
                <img
                  src={currentSlide.image}
                  alt={currentSlide.alt ?? 'Kashmir landscape'}
                  className="h-full w-full object-cover"
                  fetchPriority={currentImageIndex === 0 ? 'high' : 'auto'}
                />
              </picture>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background to-transparent"></div>

        {/* Particles */}
        <div id="embers" ref={embersRef} className="absolute inset-y-0 left-0 w-1/2"></div>
        <div id="flakes" ref={flakesRef} className="absolute inset-y-0 right-0 w-1/2"></div>
      </div>

      {/* Image indicator dots */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
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
      <div className="relative z-[2] mx-auto grid min-h-[100svh] max-w-[1300px] items-center gap-10 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1.15fr_.85fr]">
        <motion.div
          data-depth
          style={{ '--d': '0.7' } as React.CSSProperties}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {content.badge && (
            <motion.p
              variants={itemVariants}
              className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-bold tracking-[0.22em] "
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-glow"></span> {content.badge}
            </motion.p>
          )}

          <motion.h1
            variants={itemVariants}
            className="h-display text-[34px] font-extrabold text-white sm:text-[48px] lg:text-[64px]"
          >
            {renderAccents(content.title)}
          </motion.h1>

          {content.subtitle && (
            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-md text-[15px] leading-relaxed text-white/70"
            >
              {content.subtitle}
            </motion.p>
          )}

          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            {content.ctaPrimaryLabel && (
              <Link
                href={content.ctaPrimaryHref ?? '#'}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-glow ring-inner transition hover:scale-[1.03] hover:brightness-110"
              >
                {content.ctaPrimaryLabel}
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
            )}
            {content.ctaSecondaryLabel && (
              <Link
                href={content.ctaSecondaryHref ?? '#'}
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold primary-foreground transition hover:scale-[1.03] hover:bg-white/15"
              >
                ▶&nbsp; {content.ctaSecondaryLabel}
              </Link>
            )}
          </motion.div>

          {stats.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="mt-10 grid max-w-md grid-cols-4 divide-x divide-white/10 rounded-2xl glass py-4 text-center"
            >
              {stats.map((stat, i) => (
                <div key={i}>
                  <p className="text-base sm:text-lg font-extrabold primary-foreground">
                    {/^\d+$/.test(stat.value) ? Number(stat.value).toLocaleString('en-IN') : stat.value}
                    {stat.suffix}
                  </p>
                  <p className="mt-1 text-[10px] primary-foreground/55">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          )}
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
              {/* Primary golden portal border (CSS-animated, no re-render) */}
              <div
                className="portal-border absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  border: '6px solid transparent',
                  borderRadius: '24px',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />

              {/* Secondary golden glow layer - thicker and brighter */}
              <div
                className="portal-border absolute -inset-1 rounded-3xl pointer-events-none"
                style={{
                  border: '10px solid transparent',
                  borderRadius: '28px',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  filter: 'blur(6px)',
                  opacity: 0.7,
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
                {content.formKicker && (
                  <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary"></span> {content.formKicker}
                  </p>
                )}

                {content.formTitle && (
                  <h3 className="h-display mt-3 text-[26px] font-bold text-foreground">{content.formTitle}</h3>
                )}
                {content.formSubtitle && (
                  <p className="mt-1 text-[13px] text-muted-foreground">{content.formSubtitle}</p>
                )}

                <div className="mt-5 space-y-3 text-sm">
                  <input
                    aria-label="Full Name"
                    autoComplete="name"
                    className="w-full rounded-xl border border-border bg-foreground/[.04] px-4 py-3 text-foreground placeholder-foreground/45 outline-none ring-primary/60 transition focus:bg-foreground/10 focus:ring-2"
                    placeholder="Full Name *"
                  />
                  <input
                    aria-label="Phone"
                    type="tel"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-border bg-foreground/[.04] px-4 py-3 text-foreground placeholder-foreground/45 outline-none ring-primary/60 transition focus:bg-foreground/10 focus:ring-2"
                    placeholder="Phone *"
                  />
                  <input
                    aria-label="Email"
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-border bg-foreground/[.04] px-4 py-3 text-foreground placeholder-foreground/45 outline-none ring-primary/60 transition focus:bg-foreground/10 focus:ring-2"
                    placeholder="Email"
                  />
                  <button className="sweep w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110">
                    {content.formButtonLabel ?? 'Request Free Itinerary →'}
                  </button>
                </div>

                {(content.formAvatars.length > 0 || content.formNote) && (
                  <div className="mt-4 flex items-center gap-3">
                    {content.formAvatars.length > 0 && (
                      <div className="flex -space-x-2">
                        {content.formAvatars.map((avatar, i) => (
                          <Image
                            key={i}
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full border-2 border-card object-cover"
                            src={avatar}
                            alt=""
                          />
                        ))}
                      </div>
                    )}
                    {content.formNote && (
                      <p className="text-[11px] text-muted-foreground">{content.formNote}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </Tilt3D>
        </motion.div>
      </div>
    </section>
  );
}
