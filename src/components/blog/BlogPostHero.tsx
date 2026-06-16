// src/components/sections/BlogPostHero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPostHeroProps {
  category: string | null;
  title: string;
  excerpt: string | null;
  image: string;
  author: {
    name: string;
    role: string | null;
    avatar: string;
  };
  readTime: string | null;
  date: string | null;
  crumbs: Array<{ label: string; href: string }>;
}

export function BlogPostHero({
  category,
  title,
  excerpt,
  image,
  author,
  readTime,
  date,
  crumbs,
}: BlogPostHeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image src={image} alt={title} fill priority sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/45 to-brand-dark/15"></div>

      <div className="relative mx-auto max-w-[1300px] px-6 pb-9 pt-28">
        <nav className="flex items-center gap-2 text-[12.5px] text-white/85" aria-label="Breadcrumb">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span>›</span>}
              <Link
                href={crumb.href}
                className={`transition hover:text-white ${
                  i === crumbs.length - 1 ? 'font-semibold text-white' : ''
                }`}
              >
                {crumb.label}
              </Link>
            </span>
          ))}
        </nav>

        {category && (
          <motion.span
            className="mt-6 inline-block rounded-md bg-brand-bright/90 px-3 py-1.5 text-[10.5px] font-extrabold tracking-[0.12em] text-white"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {category.toUpperCase()}
          </motion.span>
        )}

        <motion.h1
          className="mt-4 max-w-2xl font-display text-[38px] font-bold leading-[1.15] text-white lg:text-[46px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {title}
        </motion.h1>

        {excerpt && (
          <motion.p
            className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-white/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {excerpt}
          </motion.p>
        )}

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-between gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-white">
            <div className="flex items-center gap-3">
              <Image
                src={author.avatar}
                alt={author.name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full border-2 border-white/40 object-cover"
              />
              <div className="leading-tight">
                <p className="text-[13px] font-bold">
                  By <span>{author.name}</span>
                </p>
                {author.role && <p className="text-[11.5px] text-white/70">{author.role}</p>}
              </div>
            </div>
            {readTime && (
              <span className="flex items-center gap-1.5 text-[12.5px]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                {readTime}
              </span>
            )}
            {date && (
              <span className="flex items-center gap-1.5 text-[12.5px]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {date}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[12.5px] font-semibold text-white/85">Share:</span>
            {['WhatsApp', 'Facebook', 'X', 'Copy'].map((label, i) => (
              <motion.a
                key={i}
                href="#"
                aria-label={`Share on ${label}`}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/35 text-white transition hover:bg-white hover:text-brand-ink"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {label === 'WhatsApp' && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z" />
                  </svg>
                )}
                {label === 'Facebook' && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1Z" />
                  </svg>
                )}
                {label === 'X' && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="m4 4 6.8 8.5L4.4 20h2.3l5.1-6 4.8 6H20l-7-8.8L19.2 4H17l-4.6 5.4L8 4Z" />
                  </svg>
                )}
                {label === 'Copy' && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                  </svg>
                )}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}