// src/components/blog/BlogArticlesGrid.tsx
'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Bookmark } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';
import type { BlogArticleData } from '@/types/blog';

interface BlogArticlesGridProps {
  articles: BlogArticleData[];
}

// Saturated category badges read well on both themes, so they stay fixed —
// except the brand category which uses the theme primary.
const badgeColor: Record<string, string> = {
  Kashmir: 'bg-primary',
  'Travel Tips': 'bg-sky-600',
  Honeymoon: 'bg-rose-500',
  Adventure: 'bg-emerald-700',
  Food: 'bg-amber-600',
  Culture: 'bg-indigo-500',
  News: 'bg-teal-600',
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

  const itemVariants: Variants = {
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
        <button className="flex items-center gap-2 text-[13px] font-semibold text-foreground/80">
          Latest First
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.4} />
        </button>
      </div>
      {articles.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-card py-12 text-center text-[13px] text-muted-foreground">
          No articles found. Try a different category or search.
        </p>
      ) : (
        <motion.div
          // Key on the current article set so the grid remounts and re-runs its
          // stagger on every page/filter change. Without this, framer-motion's
          // once-fired whileInView never re-orchestrates the swapped-in items,
          // leaving them stuck at opacity 0 (blank) after the first change.
          key={articles.map((a) => a.id).join(',')}
          className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {articles.map((article) => (
            <motion.article
              key={article.id}
              variants={itemVariants}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
            >
              <Link href={`/blog/${article.slug}`} className="block">
                <div className="relative h-[150px] overflow-hidden">
                  <Image
                    src={imgSrc(article.coverImage)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  {article.category && (
                    <span className={`absolute bottom-2.5 left-2.5 rounded ${badgeColor[article.category] ?? 'bg-primary'} px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-white`}>
                      {article.category.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="min-h-[42px] text-[14px] font-bold leading-snug transition group-hover:text-primary">
                    {article.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
                    <span>
                      {[article.dateLabel, article.readTime ? `${article.readTime} min read` : null]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </span>
                    <button
                      aria-label="Bookmark"
                      className="text-muted-foreground transition hover:text-primary"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Bookmark className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      )}
    </div>
  );
}
