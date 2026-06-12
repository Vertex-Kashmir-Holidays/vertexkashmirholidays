// src/components/sections/ContactTestimonials.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ContactTestimonials() {
  const testis = [
    { seed: 'ct-1', n: 'Aarav & Meera', loc: 'Bangalore', q: 'Vertex Kashmir made our honeymoon unforgettable. Every detail was perfect – from the houseboat to the surprise candlelight dinner in Gulmarg. Highly recommended!' },
    { seed: 'ct-2', n: 'Rohit Sharma', loc: 'Pune', q: 'Booked a family trip with my parents — hotels, cab and gondola tickets were all sorted before we landed. Zero stress, full value.' },
    { seed: 'ct-3', n: 'Sana & Imran', loc: 'Hyderabad', q: 'They replied on WhatsApp in minutes and redesigned our plan twice without any fuss. Felt like planning with a friend in Srinagar.' },
    { seed: 'ct-4', n: 'Kavya N.', loc: 'Chennai', q: 'Solo trip, first time in Kashmir. Daily check-ins from the team made me feel completely safe. The valley is magic.' },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testis.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testis.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[11.5px] font-bold tracking-[0.22em] text-brand-green2">WHAT OUR TRAVELLERS SAY</p>
      <h2 className="h-display mt-2 font-display text-[22px] font-bold">Trusted by 12,000+ Happy Travellers</h2>
      <div className="mt-5 rounded-2xl border border-brand-line bg-white p-6 shadow-soft">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={`https://picsum.photos/seed/${testis[current].seed}/90`}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
            <div>
              <span className="text-[13px] tracking-tight text-amber-400">★★★★★</span>
              <p className="mt-2 text-[12.5px] leading-relaxed text-brand-ink/75">{testis[current].q}</p>
              <p className="mt-3 text-[13px] font-bold">{testis[current].n}</p>
              <p className="text-[11.5px] text-brand-mute">{testis[current].loc}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        {testis.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? 'w-2 bg-brand-green2' : 'w-2 bg-brand-line hover:bg-brand-mute/40'
            }`}
            aria-label={`Review ${i + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
}