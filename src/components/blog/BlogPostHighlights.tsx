// src/components/sections/BlogPostHighlights.tsx
'use client';

import { motion } from 'framer-motion';

interface Highlight {
  label: string;
  icon: string;
}

interface BlogPostHighlightsProps {
  id: string;
  title: string;
  items: Highlight[];
}

export function BlogPostHighlights({ id, title, items }: BlogPostHighlightsProps) {
  return (
    <motion.section
      id={id}
      className="mt-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="scroll-mt-24 text-[17px] font-bold">{title}</h2>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-2.5"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-brand-green2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <p className="text-[11.5px] font-semibold leading-snug">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}