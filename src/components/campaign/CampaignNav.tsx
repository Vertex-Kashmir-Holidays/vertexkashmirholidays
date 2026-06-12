// src/components/sections/CampaignNav.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CampaignNavProps {
  ctaText: string;
}

export function CampaignNav({ ctaText }: CampaignNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <motion.nav
        className={`mx-auto mt-3 flex max-w-[1300px] items-center justify-between rounded-2xl px-5 py-3 ${
          scrolled ? 'glass-strong' : 'glass'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 40 40" className="h-9 w-9 text-white" fill="currentColor">
            <path d="m6 28 8-14 5 8 4-6 11 12Z" />
            <path d="m10 28 5-8 4 6 3-4 6 6Z" opacity=".55" />
          </svg>
          <span className="leading-none">
            <span className="block font-display text-[17px] font-extrabold text-white">Vertex Kashmir</span>
            <span className="block text-[8.5px] font-bold tracking-[0.42em] text-white/65">HOLIDAYS</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="tel:+919999999999"
            className="hidden items-center gap-2 text-[13px] font-semibold text-white/80 transition hover:text-white md:flex"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-glow" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
            </svg>
            +91 99 9999 9999
          </a>
          <a
            href="#reserve"
            className="sweep rounded-full bg-accent-grad px-5 py-2.5 text-[13px] font-bold text-white ring-inner shadow-glow transition hover:scale-[1.03]"
          >
            {ctaText}
          </a>
        </div>
      </motion.nav>
    </header>
  );
}