// src/components/sections/BlogPostProseBlocks.tsx
'use client';

import { motion } from 'framer-motion';

interface ProseBlock {
  id: string;
  title: string;
  type: 'text' | 'list' | 'table' | 'faq';
  content?: string;
  items?: string[] | Array<[string, string]>;
  rows?: Array<[string, string]>;
}

interface BlogPostProseBlocksProps {
  blocks: ProseBlock[];
}

export function BlogPostProseBlocks({ blocks }: BlogPostProseBlocksProps) {
  return (
    <div className="mt-10 space-y-10">
      {blocks.map((block, i) => (
        <motion.section
          key={block.id}
          id={block.id}
          className="scroll-mt-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
        >
          <h2 className="text-[17px] font-bold">{block.title}</h2>

          {block.type === 'text' && (
            <p className="mt-3 text-[13.5px] leading-[1.8] text-brand-ink/80">{block.content}</p>
          )}

          {block.type === 'list' && (
            <ul className="mt-3 space-y-2.5">
              {(block.items as string[]).map((item, j) => (
                <li key={j} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-brand-ink/80">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-bright" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {block.type === 'table' && (
            <div className="mt-3 overflow-hidden rounded-xl border border-brand-line">
              {(block.rows as Array<[string, string]>).map(([k, v], j) => (
                <div
                  key={j}
                  className={`flex justify-between gap-4 px-4 py-3 text-[13px] ${
                    j % 2 ? 'bg-brand-page' : ''
                  } ${j === (block.rows?.length || 0) - 1 ? 'font-bold' : ''}`}
                >
                  <span>{k}</span>
                  <span className="text-right">{v}</span>
                </div>
              ))}
            </div>
          )}

          {block.type === 'faq' && (
            <div className="mt-3 space-y-2.5">
              {(block.items as Array<[string, string]>).map(([q, a], j) => (
                <details key={j} className="rounded-lg border border-brand-line bg-white px-4 py-3 shadow-soft">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-[13px] font-semibold">
                    {q}
                    <svg viewBox="0 0 24 24" className="chev h-3.5 w-3.5 shrink-0 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-brand-mute">{a}</p>
                </details>
              ))}
            </div>
          )}
        </motion.section>
      ))}
    </div>
  );
}