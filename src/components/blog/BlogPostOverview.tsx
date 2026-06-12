// src/components/sections/BlogPostOverview.tsx
'use client';

import { motion } from 'framer-motion';

interface BlogPostOverviewProps {
  title: string;
  facts: string[];
  bestFor?: string;
}

export function BlogPostOverview({ title, facts, bestFor }: BlogPostOverviewProps) {
  return (
    <motion.div
      className="mt-7 rounded-xl border border-brand-line bg-brand-page px-5 py-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="flex items-center gap-2.5 text-[14.5px] font-bold text-brand-green2">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 8h4M8 12h8M8 16h6" />
        </svg>
        {title}
      </p>
      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12.5px] text-brand-ink/80">
        {facts.map((fact, i) => (
          <span key={i}>
            {i > 0 && <span className="text-brand-mute">•</span>}
            {fact}
          </span>
        ))}
        {bestFor && (
          <>
            <span className="text-brand-mute">•</span>
            <span>
              <strong>Best for:</strong> {bestFor}
            </span>
          </>
        )}
      </p>
    </motion.div>
  );
}