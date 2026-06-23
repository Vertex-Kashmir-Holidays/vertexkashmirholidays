// src/components/sections/DestinationsCTABand.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FileCheck, FileText, BadgeIndianRupee, Clock } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/brand';
import { imgSrc } from '@/lib/placeholder';

export function DestinationsCTABand() {
  const features = [
    { t: 'Free Consultation', s: 'No obligation', Icon: FileCheck },
    { t: 'Custom Itineraries', s: 'Tailored for you', Icon: FileText },
    { t: 'Best Price Guarantee', s: 'Always', Icon: BadgeIndianRupee },
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
        <div className="absolute inset-y-0 right-0 w-[55%]">
          <Image
            src={imgSrc()}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
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
                    <feat.Icon className="h-5 w-5" strokeWidth={1.8} />
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
                  <WhatsAppIcon className="h-4 w-4" />
                </span>
              </motion.a>
              <p className="mt-2.5 flex items-center justify-end gap-1.5 text-[12px] text-white/75">
                <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                Reply in 60 seconds
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}