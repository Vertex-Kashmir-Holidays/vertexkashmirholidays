// src/components/sections/DestinationsThingsToDo.tsx
'use client';

import { motion } from 'framer-motion';

export function DestinationsThingsToDo() {
  const things = [
    { t: 'Shikara Ride', s: 'Dal Lake', icon: 'M3 16c2 1 4 1 6 0s4-1 6 0 4 1 6 0M4 13h16l-2-4H8ZM12 9V5l4 2' },
    { t: 'Gondola Ride', s: 'Gulmarg', icon: 'M12 3v4M2 5l20-2M7 7v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7Z' },
    { t: 'Trekking', s: 'High Altitude', icon: 'm3 20 6-12 4 7 3-4 5 9Z' },
    { t: 'Skiing', s: 'Winter Sports', icon: 'm4 20 16-6M17 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4M8 9l4 3-1 5M12 12l4 1 2-3' },
    { t: 'Gulmarg', s: 'Ski Resort', icon: 'm8 3 4 8 5-5 4 14H3l5-7Z' },
    { t: 'Mughal Gardens', s: 'Heritage', icon: 'M12 3a4 4 0 0 1 4 4c0 3-4 6-4 6s-4-3-4-6a4 4 0 0 1 4-4ZM12 13v8M8 21h8' },
    { t: 'Photography', s: 'Scenic Views', icon: 'M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4ZM12 13a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z' },
    { t: 'Local Cuisine', s: 'Wazwan', icon: 'M4 19h16M5 19a7 7 0 0 1 14 0M12 12V9' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="mx-auto max-w-[1300px] px-6 py-12">
      <motion.h2
        className="text-[22px] font-bold text-brand-green"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Popular things to do in Kashmir
      </motion.h2>
      <motion.div
        className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {things.map((thing, i) => (
          <motion.a
            key={i}
            href="#"
            variants={itemVariants}
            className="flex items-center gap-2.5 rounded-xl border border-brand-line bg-white px-3 py-3 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-green2 hover:shadow-card"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-brand-green2">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d={thing.icon} />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block text-[12px] font-bold">{thing.t}</span>
              <span className="block text-[10.5px] text-brand-mute">{thing.s}</span>
            </span>
          </motion.a>
        ))}
      </motion.div>
      <div className="mt-4 flex justify-end">
        <a href="#" className="flex items-center gap-1.5 text-[13px] font-bold text-brand-green2 hover:underline">
          View all experiences
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </div>
  );
}