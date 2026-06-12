// src/components/sections/AboutPress.tsx
'use client';

import { motion } from 'framer-motion';

export function AboutPress() {
  const pressItems = [
    '<span className="text-[15px] leading-none"><span className="block text-[9px] font-semibold tracking-wide">Outlook</span><span className="font-extrabold lowercase tracking-tight" style={{fontSize: "19px"}}>traveller</span></span>',
    '<span className="text-[18px] font-extrabold lowercase tracking-tight">lonely <span className="font-semibold">planet</span></span>',
    '<span className="flex items-center gap-1.5 text-[17px] font-extrabold tracking-tight"><span className="grid h-5 w-5 place-items-center rounded-full border-2 border-current text-[9px]">◉</span>Tripadvisor</span>',
    '<span className="font-display text-[17px] font-semibold tracking-[0.18em]">JKTDC</span>',
    '<span className="text-[17px] font-bold tracking-tight">Make<span className="font-extrabold">My</span>Trip</span>',
    '<span className="font-display text-[15px] font-bold uppercase leading-tight">The Times<br/>of India</span>',
    '<span className="font-display text-[19px] font-bold leading-none">Forbes<span className="block text-right text-[8px] font-sans font-semibold tracking-[0.3em]">INDIA</span></span>',
  ];

  return (
    <section className="mx-auto max-w-[1300px] px-6 pb-14">
      <motion.div
        className="flex flex-wrap items-center gap-x-10 gap-y-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-[11.5px] font-bold tracking-[0.22em] text-brand-ink/70">AS FEATURED IN</p>
        <div className="flex flex-1 flex-wrap items-center justify-between gap-x-10 gap-y-5 opacity-80 grayscale">
          {pressItems.map((item, i) => (
            <motion.span
              key={i}
              className="text-brand-ink/80"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}