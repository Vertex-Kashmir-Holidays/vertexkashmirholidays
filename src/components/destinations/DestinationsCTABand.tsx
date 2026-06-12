// src/components/sections/DestinationsCTABand.tsx
'use client';

import { motion } from 'framer-motion';

export function DestinationsCTABand() {
  const features = [
    { t: 'Free Consultation', s: 'No obligation', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M9 14l2 2 4-4' },
    { t: 'Custom Itineraries', s: 'Tailored for you', icon: 'M4 3h16v18H4ZM8 7h8M8 11h8M8 15h5' },
    { t: 'Best Price Guarantee', s: 'Always', icon: 'M12 7v1m0 8v1m2.5-7.5c0-1-1.1-1.7-2.5-1.7s-2.5.7-2.5 1.6c0 2.4 5 1.4 5 3.8 0 .9-1.1 1.6-2.5 1.6s-2.5-.7-2.5-1.7' },
  ];

  return (
    <div className="mx-auto max-w-[1300px] px-6 pt-12">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-brand-green"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <img
          src="https://picsum.photos/seed/cta-lake/1100/420"
          alt=""
          className="absolute inset-y-0 right-0 h-full w-[55%] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green via-brand-green/95 to-brand-green/20"></div>
        <div className="relative grid items-center gap-8 p-9 lg:grid-cols-[1.1fr_1.3fr] lg:p-11">
          <div>
            <h2 className="text-[26px] font-bold leading-snug text-white lg:text-[28px]">
              Can't decide which destination is perfect for you?
            </h2>
            <p className="mt-3.5 max-w-xs text-[13.5px] leading-relaxed text-white/80">
              Let our local experts help you plan the perfect Kashmir experience.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-7">
            <div className="flex flex-wrap gap-8">
              {features.map((feat, i) => (
                <div key={i} className="text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={feat.icon} />
                    </svg>
                  </span>
                  <p className="mt-2.5 text-[12.5px] font-bold text-white">{feat.t}</p>
                  <p className="text-[11px] text-white/70">{feat.s}</p>
                </div>
              ))}
            </div>
            <div className="text-right">
              <motion.a
                href="#"
                className="inline-flex items-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-[14px] font-bold text-brand-ink shadow-card transition hover:brightness-95"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Talk to an Expert
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-bright text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z" />
                  </svg>
                </span>
              </motion.a>
              <p className="mt-2.5 flex items-center justify-end gap-1.5 text-[12px] text-white/75">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                Reply in 60 seconds
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}