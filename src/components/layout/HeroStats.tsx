'use client';

import { motion } from 'framer-motion';
import { User, Users, Clock, Star, type LucideIcon } from 'lucide-react';
import type { SiteStatData } from '@/types/home';

// Decorative icons cycled across the DB-driven stats.
const statIcons: LucideIcon[] = [User, Users, Clock, Star];

interface HeroStatsProps {
  stats: SiteStatData[];
}

export function HeroStats({ stats }: HeroStatsProps) {
  if (stats.length === 0) return null;

  return (
    <div className="mt-9 flex flex-wrap gap-x-12 gap-y-5">
      {stats.map((stat, i) => {
        const Icon = statIcons[i % statIcons.length];
        return (
          <div
            key={i}
            className="hero-reveal flex items-center gap-3 text-white"
            style={{ '--hr-y': '30px', '--hr-delay': `${0.2 + i * 0.15}s` } as React.CSSProperties}
          >
            <motion.span
              className="text-emerald-300"
              whileHover={{ scale: 1.2, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon className="h-7 w-7" strokeWidth={1.8} />
            </motion.span>
            <div>
              <p className="text-[18px] font-bold leading-tight">
                {/^\d+$/.test(stat.value) ? Number(stat.value).toLocaleString('en-IN') : stat.value}
                {stat.suffix}
              </p>
              <p className="text-[14px] text-white/70">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
