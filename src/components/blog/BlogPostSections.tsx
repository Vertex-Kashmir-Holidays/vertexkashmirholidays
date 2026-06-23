// src/components/sections/BlogPostSections.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Mountain, MapPin } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';

interface Section {
  title: string;
  tag?: string;
  body: string;
  image?: string;
}

interface BlogPostSectionsProps {
  id: string;
  title: string;
  numberPrefix?: string;
  sections: Section[];
}

export function BlogPostSections({ id, title, numberPrefix, sections }: BlogPostSectionsProps) {
  return (
    <motion.section
      id={id}
      className="mt-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="flex scroll-mt-24 items-center gap-2.5 text-[20px] font-bold">
        <Mountain className="h-7 w-7 text-brand-green" strokeWidth={2} />
        {title}
      </h2>
      <div className="relative mt-6">
        <span className="absolute bottom-8 left-[26px] top-4 w-px bg-brand-line" aria-hidden="true"></span>
        <div className="space-y-4">
          {sections.map((section, i) => (
            <motion.section
              key={i}
              id={`sec-${i + 1}`}
              className="relative flex scroll-mt-24 gap-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="relative z-10 mt-1 grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-brand-green text-white shadow-card">
                <span className="text-center leading-none">
                  {numberPrefix && (
                    <span className="block text-[8px] font-bold tracking-wide">{numberPrefix}</span>
                  )}
                  <span className="block text-[16px] font-extrabold">{i + 1}</span>
                </span>
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4 rounded-xl border border-brand-line bg-white p-4 shadow-soft transition hover:shadow-card md:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15.5px] font-bold">{section.title}</h3>
                  {section.tag && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-brand-mute">
                      <MapPin className="h-3 w-3" strokeWidth={2} />
                      {section.tag}
                    </p>
                  )}
                  <p className="mt-2 text-[13px] leading-relaxed text-brand-ink/75">{section.body}</p>
                </div>
                {section.image && (
                  <div className="relative h-[88px] w-full shrink-0 overflow-hidden rounded-lg md:w-[150px]">
                    <Image
                      src={imgSrc(section.image)}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 150px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </motion.section>
  );
}