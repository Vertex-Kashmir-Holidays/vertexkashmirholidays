'use client';

import { motion, type Variants } from 'framer-motion';
import { User, Users, Clock, Star, type LucideIcon } from 'lucide-react';
import type { SiteStatData } from '@/types/home';

// Decorative icons cycled across the DB-driven stats.
const statIcons: LucideIcon[] = [User, Users, Clock, Star];

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

interface HeroStatsProps {
  stats: SiteStatData[];
}

export function HeroStats({ stats }: HeroStatsProps) {
  if (stats.length === 0) return null;

  return (
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
  );
}
