// src/components/sections/BlogArticlesGrid.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Article {
  seed: string;
  cat: string;
  chip: string;
  title: string;
  date: string;
  read: string;
}

interface BlogArticlesGridProps {
  articles: Article[];
}

const badgeColor: Record<string, string> = {
  'KASHMIR': 'bg-brand-bright',
  'TRAVEL TIPS': 'bg-sky-600',
  'HONEYMOON': 'bg-rose-500',
  'ADVENTURE': 'bg-emerald-700',
  'FOOD': 'bg-amber-600',
  'DESTINATIONS': 'bg-teal-600',
  'CULTURE': 'bg-indigo-500',
};

export function BlogArticlesGrid({ articles }: BlogArticlesGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="mt-9">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold">All Articles</h2>
        <button className="flex items-center gap-2 text-[13px] font-semibold text-brand-ink/80">
          Latest First
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <motion.div
        className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {articles.map((article, i) => (
          <motion.article
            key={i}
            variants={itemVariants}
            className="group overflow-hidden rounded-xl border border-brand-line bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
          >
            <Link href="#" className="block">
              <div className="relative h-[150px] overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/${article.seed}/480/340`}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className={`absolute bottom-2.5 left-2.5 rounded ${badgeColor[article.cat]} px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-white`}>
                  {article.cat}
                </span>
              </div>
              <div className="p-4">
                <h3 className="min-h-[42px] text-[14px] font-bold leading-snug transition group-hover:text-brand-green2">
                  {article.title}
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11.5px] text-brand-mute">
                  <span>{article.date} &nbsp;·&nbsp; {article.read}</span>
                  <button
                    aria-label="Bookmark"
                    className="text-brand-mute transition hover:text-brand-green2"
                    onClick={(e) => e.preventDefault()}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                      <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </motion.div>
    </div>
  );
}