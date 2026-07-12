// src/components/blog/BlogSidebar.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { PenLine, ArrowRight, ShieldCheck } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';
import type { BlogCategoryData, BlogPageContent, BlogTrendingData } from '@/types/blog';

interface BlogSidebarProps {
  content: BlogPageContent;
  categories: BlogCategoryData[];
  trending: BlogTrendingData[];
}

export function BlogSidebar({ content, categories, trending }: BlogSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* About Blog */}
      <motion.div
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <PenLine className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-[16px] font-bold">{content.aboutTitle}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              {content.aboutText}
            </p>
            {content.aboutCtaLabel && (
              <Link
                href={content.aboutCtaHref ?? '#'}
                className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-primary hover:underline"
              >
                {content.aboutCtaLabel}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Popular Categories */}
      {categories.length > 0 && (
        <motion.div
          className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-[16px] font-bold">Popular Categories</h2>
          <ul className="mt-3 divide-y divide-border">
            {categories.map((cat, i) => (
              <motion.li
                key={cat.slug}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href="#"
                  className="group flex items-center justify-between py-2.5 text-[14px]"
                >
                  <span className="font-medium text-foreground/85 transition group-hover:text-primary">
                    {cat.name}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-bold text-muted-foreground">
                    {cat.count}
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
          <button className="mt-4 w-full rounded-lg border-[1.5px] border-border py-2.5 text-[14px] font-bold text-primary transition hover:border-primary">
            View All Categories
          </button>
        </motion.div>
      )}

      {/* Trending Posts */}
      {trending.length > 0 && (
        <motion.div
          className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-[16px] font-bold">Trending Posts</h2>
          <ul className="mt-4 space-y-4">
            {trending.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/blog/${item.slug}`} className="group flex items-start gap-3">
                  <Image
                    src={imgSrc(item.image)}
                    alt=""
                    width={68}
                    height={52}
                    className="h-[52px] w-[68px] shrink-0 rounded-lg object-cover"
                  />
                  <div className="leading-snug">
                    <p className="text-[14px] font-bold transition group-hover:text-primary">
                      {item.title}
                    </p>
                    {item.dateLabel && <p className="mt-1 text-[12px] text-muted-foreground">{item.dateLabel}</p>}
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Newsletter */}
      <motion.div
        className="rounded-2xl border border-border bg-muted p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-[16px] font-bold">{content.newsletterTitle}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          {content.newsletterText}
        </p>
        <form className="mt-4 space-y-2.5" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[14px] text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Enter your email"
          />
          <motion.button
            className="w-full rounded-lg bg-primary py-2.5 text-[14px] font-bold text-primary-foreground transition hover:brightness-110"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Subscribe
          </motion.button>
        </form>
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
          No spam. Unsubscribe anytime.
        </p>
      </motion.div>
    </aside>
  );
}
