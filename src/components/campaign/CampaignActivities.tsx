// src/components/campaign/CampaignActivities.tsx
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';
import type { CampaignActivity } from '@/types/campaign';

interface CampaignActivitiesProps {
  title: string | null;
  activities: CampaignActivity[];
}

export function CampaignActivities({ title, activities }: CampaignActivitiesProps) {
  const scroll = (direction: 'prev' | 'next') => {
    const row = document.getElementById('actRow');
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 230;
    row.scrollBy({ left: (direction === 'next' ? 1 : -1) * (width + 20) * 2, behavior: 'smooth' });
  };

  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.p
            className="text-[11px] font-extrabold tracking-[0.24em] text-camp-accent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            INCLUDED EXPERIENCES
          </motion.p>
          <motion.h2
            className="h-display mt-3 text-4xl font-bold text-foreground"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {title}
          </motion.h2>
        </div>
        <div className="flex gap-2">
          {(['prev', 'next'] as const).map((dir) => (
            <motion.button
              key={dir}
              onClick={() => scroll(dir)}
              aria-label={dir === 'prev' ? 'Previous activities' : 'Next activities'}
              className="glass grid h-11 w-11 place-items-center rounded-full text-foreground transition hover:bg-foreground/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {dir === 'prev' ? <ChevronLeft className="h-5 w-5" strokeWidth={2.2} /> : <ChevronRight className="h-5 w-5" strokeWidth={2.2} />}
            </motion.button>
          ))}
        </div>
      </div>
      <div id="actRow" className="scrollbar-none mt-9 flex gap-5 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {activities.map((activity, i) => (
          <motion.article
            key={i}
            className="group relative h-[300px] w-[230px] shrink-0 overflow-hidden rounded-3xl border border-border shadow-card"
            style={{ scrollSnapAlign: 'start' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <img
              src={imgSrc(activity.image)}
              alt={activity.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
            <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white opacity-0 backdrop-blur-xl transition duration-300 group-hover:opacity-100"><ArrowRight className="h-4 w-4" strokeWidth={2.2} /></span>
            <p className="absolute inset-x-0 bottom-0 p-5 text-[15px] font-bold text-white transition duration-300 group-hover:-translate-y-1">
              {activity.title}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
