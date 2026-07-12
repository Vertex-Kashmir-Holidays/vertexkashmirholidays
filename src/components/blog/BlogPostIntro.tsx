// src/components/sections/BlogPostIntro.tsx
'use client';

import { motion } from 'framer-motion';

interface BlogPostIntroProps {
  paragraphs: string[];
}

export function BlogPostIntro({ paragraphs }: BlogPostIntroProps) {
  return (
    <motion.div
      id="intro"
      className="space-y-4 text-[16px] leading-[1.8] text-brand-ink/85"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {paragraphs.map((p, i) => (
        <p key={i} className={i === 0 ? 'dropcap' : ''}>
          {p}
        </p>
      ))}
    </motion.div>
  );
}