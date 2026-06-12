// src/components/sections/CampaignTestimonials.tsx
'use client';

import { motion } from 'framer-motion';

interface Testimonial {
  seed: string;
  name: string;
  location: string;
  quote: string;
}

interface CampaignTestimonialsProps {
  testimonials: Testimonial[];
}

export function CampaignTestimonials({ testimonials }: CampaignTestimonialsProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-20">
      <div className="text-center">
        <motion.p
          className="text-[11px] font-extrabold tracking-[0.24em] text-accent"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          TRAVELLER STORIES
        </motion.p>
        <motion.h2
          className="h-display mt-3 text-4xl font-bold text-white"
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
            <p className="text-[13px] tracking-[0.18em] text-amber-300">★★★★★</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/80">"{testimonial.quote}"</p>
            <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
              <img
                src={`https://picsum.photos/seed/${testimonial.seed}/80/80`}
                alt=""
                className="h-10 w-10 rounded-full border border-white/20 object-cover"
              />
              <div>
                <p className="text-[13px] font-bold text-white">{testimonial.name}</p>
                <p className="text-[11px] text-white/50">{testimonial.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}