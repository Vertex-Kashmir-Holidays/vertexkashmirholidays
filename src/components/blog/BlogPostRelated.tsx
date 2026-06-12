// src/components/sections/BlogPostRelated.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface RelatedPost {
  seed: string;
  category: string;
  color: string;
  title: string;
  date: string;
  readTime: string;
}

interface BlogPostRelatedProps {
  posts: RelatedPost[];
}

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
        <div className="flex gap-2">
          <motion.button
            onClick={prevSlide}
            aria-label="Previous"
            className="grid h-9 w-9 place-items-center rounded-full border border-brand-line text-brand-mute shadow-soft transition hover:border-brand-green2 hover:text-brand-green2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ‹
          </motion.button>
          <motion.button
            onClick={nextSlide}
            aria-label="Next"
            className="grid h-9 w-9 place-items-center rounded-full border border-brand-line text-brand-mute shadow-soft transition hover:border-brand-green2 hover:text-brand-green2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ›
          </motion.button>
        </div>
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
                key={i}
                className="group overflow-hidden rounded-xl border border-brand-line bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href="#" className="block">
                  <div className="relative h-[150px] overflow-hidden">
                    <img
                      src={`https://picsum.photos/seed/${post.seed}/480/340`}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className={`absolute bottom-2 left-2 rounded ${post.color} px-2 py-0.5 text-[8.5px] font-extrabold tracking-wide text-white`}>
                      {post.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="min-h-[42px] text-[13px] font-bold leading-snug transition group-hover:text-brand-green2">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-[11px] text-brand-mute">
                      {post.date} &nbsp;·&nbsp; {post.readTime}
                    </p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="mt-6 flex justify-center gap-1.5">
          {Array.from({ length: Math.ceil(posts.length / itemsPerView) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i * itemsPerView)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === Math.floor(currentIndex / itemsPerView) 
                  ? 'w-4 bg-brand-green2' 
                  : 'w-1.5 bg-brand-line'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}