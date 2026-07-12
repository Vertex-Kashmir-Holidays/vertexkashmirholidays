// src/components/home/HeroSection.tsx
'use client';

import { ArrowRight } from 'lucide-react';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';
import { renderAccents } from '@/lib/accents';
import type { HeroContentData, HeroSlideData, SiteStatData } from '@/types/home';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface HeroSectionProps {
content: HeroContentData;
slides: HeroSlideData[];
stats: SiteStatData[];
}

export function HeroSection({ content, slides, stats }: HeroSectionProps) {
const [currentImageIndex, setCurrentImageIndex] = useState(0);
const [mounted, setMounted] = useState(false);
const embersRef = useRef<HTMLDivElement>(null);
const flakesRef = useRef<HTMLDivElement>(null);

useEffect(() => { setMounted(true); }, []);
useEffect(() => {
  if (slides.length < 2) return;
  // Rotate background every 10 seconds
  const interval = setInterval(() => {
    setCurrentImageIndex((prev) => (prev + 1) % slides.length);
  }, 10000);
  return () => clearInterval(interval);
}, [slides.length]);

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
            initial={{ opacity: mounted ? 0 : 1, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={currentSlide.image}
              alt={currentSlide.alt ?? 'Kashmir landscape'}
              fill
              className="object-cover"
              priority={currentImageIndex === 0}
              sizes="100vw"
              quality={85}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for text readability — vertical scrim on mobile (headline + form
          stack), horizontal from lg up (two columns). */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70 lg:bg-gradient-to-r lg:from-black/60 lg:via-black/30 lg:to-transparent"></div>
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background to-transparent"></div>

      {/* Particles */}
      <div id="embers" ref={embersRef} className="absolute inset-y-0 left-0 w-1/2"></div>
      <div id="flakes" ref={flakesRef} className="absolute inset-y-0 right-0 w-1/2"></div>
    </div>
    {/* Image indicator dots */}
    <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1">
      {slides.map((_, index) => (
        <button
          key={index}
          onClick={() => setCurrentImageIndex(index)}
          className="grid h-6 min-w-6 place-items-center"
          aria-label={`Switch to image ${index + 1}`}
        >
          <span className={`block h-1.5 rounded-full transition-all duration-300 ${
            index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
          }`} />
        </button>
      ))}
    </div>

    {/* Main content */}
    <div className="relative z-[2] mx-auto grid w-full min-h-[100svh] max-w-[1300px] items-center gap-6 px-4 pb-20 pt-32 sm:px-6 sm:gap-8 lg:gap-10 lg:grid-cols-[1.15fr_.85fr]">
      <div
        data-depth
        style={{ '--d': '0.7' } as React.CSSProperties}
        className="min-w-0"
      >
        {content.badge && (
          <p
            className="hero-reveal mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[12px] font-bold tracking-[0.22em] "
            style={{ '--hr-y': '30px', '--hr-delay': '0.2s' } as React.CSSProperties}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-glow"></span> {content.badge}
          </p>
        )}
        <h1
          className="hero-reveal h-display font-extrabold text-white"
          style={{ '--hr-y': '30px', '--hr-delay': '0.3s' } as React.CSSProperties}
        >
            <span className="hero-brand mb-2 block whitespace-nowrap text-[14px] font-bold tracking-wide text-white/85 sm:mb-2.5 sm:text-[18px] lg:mb-3 lg:text-[20px]">
              Vertex Kashmir Holidays
            </span>
            <span className="hero-tagline block text-[30px] leading-[1.1] sm:text-[48px] lg:text-[64px]">
              {renderAccents(content.title)}
            </span>
        </h1>
        {content.subtitle && (
          <p
            className="hero-reveal mt-6 max-w-md text-[16px] leading-relaxed text-white/70"
            style={{ '--hr-delay': '0.4s' } as React.CSSProperties}
          >
            {content.subtitle}
          </p>
        )}
        <div
          className="hero-reveal mt-8 flex flex-wrap items-center gap-3"
          style={{ '--hr-y': '30px', '--hr-delay': '0.5s' } as React.CSSProperties}
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
        </div>
        {stats.length > 0 && (
          <div
            className="hero-reveal mt-10 grid max-w-md grid-cols-4 divide-x divide-white/10 rounded-2xl glass py-4 text-center"
            style={{ '--hr-y': '30px', '--hr-delay': '0.6s' } as React.CSSProperties}
          >
            {stats.map((stat, i) => (
              <div key={i}>
                <p className="text-base sm:text-lg font-extrabold primary-foreground">
                  {/^\d+$/.test(stat.value) ? Number(stat.value).toLocaleString('en-IN') : stat.value}
                  {stat.suffix}
                </p>
                <p className="mt-1 text-[12px] primary-foreground/55">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Lead-capture card — uses the shared HeroLeadCard component so the
          home hero form is visually identical to Tours/Destinations heroes. */}
      <HeroLeadCard
        source="home"
        kicker={content.formKicker ?? undefined}
        title={content.formTitle ?? undefined}
        subtitle={content.formSubtitle ?? undefined}
        buttonLabel={content.formButtonLabel ?? undefined}
        className="justify-self-center lg:justify-self-end"
      />
    </div>
  </section>
);
}
