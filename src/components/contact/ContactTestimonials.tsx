// src/components/contact/ContactTestimonials.tsx
'use client';

import type { ContactSectionHeading, ContactTestimonialData } from '@/types/contact';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ContactTestimonialsProps {
  heading: ContactSectionHeading;
  testimonials: ContactTestimonialData[];
}

export function ContactTestimonials({ heading, testimonials }: ContactTestimonialsProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (testimonials.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  const t = testimonials[current];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
      <h2 className="h-display mt-2 font-display text-[22px] font-bold">{heading.title}</h2>
      <div className="mt-5 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {t.avatar && (
              <Image
                src={t.avatar}
                alt={t.name}
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            )}
            <div>
              <span className="flex gap-0.5 text-amber-400">
                {Array.from({ length: Math.max(1, Math.min(5, t.rating)) }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                ))}
              </span>
              <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/75">{t.quote}</p>
              <p className="mt-3 text-[13px] font-bold">{t.name}</p>
              {t.location && <p className="text-[11.5px] text-muted-foreground">{t.location}</p>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        {testimonials.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? 'w-2 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/40'
            }`}
            aria-label={`Review ${i + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
