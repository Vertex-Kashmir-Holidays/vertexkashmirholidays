'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { renderAccents } from '@/lib/accents';
import type { SectionHeading, SiteStatData } from '@/types/home';

interface ToursHeroSectionProps {
  heading: SectionHeading;
  stats: SiteStatData[];
}

// Decorative icons cycled across the DB-driven stats.
const statIcons = [
  { icon: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8', icon2: 'M4 21a8 8 0 0 1 16 0' },
  { icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', icon2: 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8', icon3: 'M22 21v-2a4 4 0 0 0-3-3.9' },
  { icon: 'M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18', icon2: 'M12 7v5l3 3' },
  { icon: 'M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z' },
];

export function ToursHeroSection({ heading, stats }: ToursHeroSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  return (
    <section className="relative overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <picture className="block h-full w-full">
          <source media="(max-width: 640px)" srcSet="/hero/gulmarg.webp" />
          <img
            src="/hero/gulmarg-lg.webp"
            alt="Kashmir valley"
            className="h-full w-full object-cover"
          />
        </picture>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/50 to-transparent"></div>

      <div className="relative mx-auto max-w-[1300px] px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:pb-20 lg:pt-28">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] text-white/80" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <span>›</span>
          <Link href="/tours" className="transition hover:text-white">Tours</Link>
        </nav>

        {/* Title Block */}
        <div className="mt-6">
          <motion.h1
            className="h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {renderAccents(heading.title)}
          </motion.h1>
          {heading.subtitle && (
            <motion.p
              className="mt-3 text-[15px] text-white/85"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {heading.subtitle}
            </motion.p>
          )}
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <motion.div
            className="mt-9 flex flex-wrap gap-x-12 gap-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat, i) => {
              const icons = statIcons[i % statIcons.length];
              return (
                <motion.div key={i} variants={itemVariants} className="flex items-center gap-3 text-white">
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7 text-emerald-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <path d={icons.icon} />
                    {icons.icon2 && <path d={icons.icon2} />}
                    {icons.icon3 && <path d={icons.icon3} />}
                  </motion.svg>
                  <div>
                    <p className="text-[17px] font-bold leading-tight">
                      {/^\d+$/.test(stat.value) ? Number(stat.value).toLocaleString('en-IN') : stat.value}
                      {stat.suffix}
                    </p>
                    <p className="text-[12px] text-white/70">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
