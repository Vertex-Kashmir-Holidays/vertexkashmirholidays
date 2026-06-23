'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { User, Users, Clock, Star, type LucideIcon } from 'lucide-react';
import { renderAccents } from '@/lib/accents';
import { SecondaryHero } from '@/components/layout/SecondaryHero';
import type { SectionHeading, SiteStatData } from '@/types/home';

interface ToursHeroSectionProps {
  heading: SectionHeading;
  stats: SiteStatData[];
}

// Decorative icons cycled across the DB-driven stats.
const statIcons: LucideIcon[] = [User, Users, Clock, Star];

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
    <SecondaryHero image="/hero/gulmarg-lg.webp" imageMobile="/hero/gulmarg.webp" alt="Kashmir valley">
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
              const Icon = statIcons[i % statIcons.length];
              return (
                <motion.div key={i} variants={itemVariants} className="flex items-center gap-3 text-white">
                  <motion.span
                    className="text-emerald-300"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </motion.span>
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
    </SecondaryHero>
  );
}
