// src/components/campaign/CampaignTestimonials.tsx
'use client';

import { motion } from 'framer-motion';
import type { CampaignTestimonial } from '@/types/campaign';

interface CampaignTestimonialsProps {
  testimonials: CampaignTestimonial[];
}

export function CampaignTestimonials({ testimonials }: CampaignTestimonialsProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-20">
      <div className="text-center">
        <motion.p
          className="text-[11px] font-extrabold tracking-[0.24em] text-camp-accent"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          TRAVELLER STORIES
        </motion.p>
        <motion.h2
          className="h-display mt-3 text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Straight from the trip
        </motion.h2>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {testimonials.map((testimonial, i) => (
          <motion.div
            key={i}
            className="glass rounded-3xl p-6 shadow-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <p className="text-[13px] tracking-[0.18em] text-amber-500 dark:text-amber-300">★★★★★</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/80">&ldquo;{testimonial.quote}&rdquo;</p>
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              {testimonial.image && (
                <img src={testimonial.image} alt="" className="h-10 w-10 rounded-full border border-border object-cover" />
              )}
              <div>
                <p className="text-[13px] font-bold text-foreground">{testimonial.name}</p>
                <p className="text-[11px] text-muted-foreground">{testimonial.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
