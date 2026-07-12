// src/components/sections/BlogPostOverview.tsx
'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

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
      <p className="flex items-center gap-2.5 text-[16px] font-bold text-brand-green2">
        <FileText className="h-5 w-5" strokeWidth={1.8} />
        {title}
      </p>
      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] text-brand-ink/80">
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