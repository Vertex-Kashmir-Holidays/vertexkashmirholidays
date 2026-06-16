// src/components/blog/BlogPostRelated.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { BlogArticleData } from '@/types/blog';

interface BlogPostRelatedProps {
  posts: BlogArticleData[];
}

// Saturated category badges read well on both themes; the brand category
// uses the theme primary.
const badgeColor: Record<string, string> = {
  Kashmir: 'bg-primary',
  'Travel Tips': 'bg-sky-600',
  Honeymoon: 'bg-rose-500',
  Adventure: 'bg-emerald-700',
  Food: 'bg-amber-600',
  Culture: 'bg-indigo-500',
  News: 'bg-teal-600',
};

export function BlogPostRelated({ posts }: BlogPostRelatedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // Calculate items per view based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (posts.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev + itemsPerView >= posts.length ? 0 : prev + itemsPerView
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev - itemsPerView < 0 ? Math.max(0, posts.length - itemsPerView) : prev - itemsPerView
    );
  };

  const visiblePosts = posts.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <motion.section
      id="related"
      className="mt-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold">Keep Reading</h2>
        {posts.length > itemsPerView && (
          <div className="flex gap-2">
            <motion.button
              onClick={prevSlide}
              aria-label="Previous"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ‹
            </motion.button>
            <motion.button
              onClick={nextSlide}
              aria-label="Next"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ›
            </motion.button>
          </div>
        )}
      </div>

      <div className="relative mt-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {visiblePosts.map((post, i) => (
              <motion.article
                key={post.id}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative h-[150px] overflow-hidden">
                    {post.coverImage && (
                      <Image
                        src={post.coverImage}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                    {post.category && (
                      <span className={`absolute bottom-2 left-2 rounded ${badgeColor[post.category] ?? 'bg-primary'} px-2 py-0.5 text-[8.5px] font-extrabold tracking-wide text-white`}>
                        {post.category.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="min-h-[42px] text-[13px] font-bold leading-snug transition group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {[post.dateLabel, post.readTime ? `${post.readTime} min read` : null]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        {posts.length > itemsPerView && (
          <div className="mt-6 flex justify-center gap-1.5">
            {Array.from({ length: Math.ceil(posts.length / itemsPerView) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i * itemsPerView)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === Math.floor(currentIndex / itemsPerView)
                    ? 'w-4 bg-primary'
                    : 'w-1.5 bg-border'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
