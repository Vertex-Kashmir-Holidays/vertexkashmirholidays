// src/components/sections/BlogFeaturedStory.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface BlogFeaturedStoryProps {
  story: {
    title: string;
    excerpt: string;
    image: string;
    author: {
      name: string;
      image: string;
    };
    date: string;
    readTime: string;
  };
}

export function BlogFeaturedStory({ story }: BlogFeaturedStoryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[20px] font-bold">Featured Story</h2>
      <article className="mt-4 grid overflow-hidden rounded-2xl border border-brand-line bg-white shadow-soft md:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col p-6 lg:p-7">
          <span className="w-fit rounded-md bg-brand-bright px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white">
            FEATURED
          </span>
          <h3 className="mt-4 text-[24px] font-bold leading-snug">{story.title}</h3>
          <p className="mt-3 text-[13px] leading-relaxed text-brand-mute">{story.excerpt}</p>
          <div className="mt-4 flex items-center gap-3">
            <img
              src={story.author.image}
              alt={story.author.name}
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="leading-tight">
              <p className="text-[12.5px] font-semibold">
                By <strong>{story.author.name}</strong>
              </p>
              <p className="text-[11.5px] text-brand-mute">
                {story.date} &nbsp;·&nbsp; {story.readTime} read
              </p>
            </div>
          </div>
          <Link
            href="#"
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-[12.5px] font-bold text-white shadow-soft transition hover:brightness-110"
          >
            Read Full Story
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
        <div className="min-h-[220px]">
          <img
            src={story.image}
            alt={story.title}
            className="h-full w-full object-cover"
          />
        </div>
      </article>
    </motion.div>
  );
}