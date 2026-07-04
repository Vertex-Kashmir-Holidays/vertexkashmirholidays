// src/components/sections/BlogPostHero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar, Link2, Check } from 'lucide-react';
import { WhatsAppIcon, FacebookIcon, TwitterIcon } from '@/components/icons/brand';
import { imgSrc } from '@/lib/placeholder';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';
import { useState, useEffect } from 'react';

interface BlogPostHeroProps {
  category: string | null;
  title: string;
  excerpt: string | null;
  image: string;
  imageMobile?: string | null;
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
  imageMobile,
  author,
  readTime,
  date,
  crumbs,
}: BlogPostHeroProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareHref = {
    WhatsApp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    X: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
  } as Record<string, string>;

  return (
    <section className="relative overflow-hidden bg-brand-dark">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {imageMobile ? (
          <>
            <Image src={imgSrc(imageMobile)} alt={title} fill priority sizes="100vw" className="object-cover sm:hidden" />
            <Image src={imgSrc(image)} alt={title} fill priority sizes="100vw" className="hidden object-cover sm:block" />
          </>
        ) : (
          <Image src={imgSrc(image)} alt={title} fill priority sizes="100vw" className="object-cover" />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/45 to-brand-dark/15"></div>

      <div className="relative mx-auto grid max-w-[1300px] items-center gap-10 px-6 pb-9 pt-28 lg:grid-cols-[1fr_minmax(0,340px)]">
       <div>
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
          className="mt-4 max-w-2xl font-display text-3xl font-bold leading-[1.15] text-white sm:text-[38px] lg:text-[46px]"
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
                <Clock className="h-4 w-4" strokeWidth={2} />
                {readTime}
              </span>
            )}
            {date && (
              <span className="flex items-center gap-1.5 text-[12.5px]">
                <Calendar className="h-4 w-4" strokeWidth={2} />
                {date}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[12.5px] font-semibold text-white/85">Share:</span>
            {(['WhatsApp', 'Facebook', 'X'] as const).map((label) => (
              <motion.a
                key={label}
                href={shareUrl ? shareHref[label] : '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${label}`}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/35 text-white transition hover:bg-white hover:text-brand-ink"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {label === 'WhatsApp' && <WhatsAppIcon className="h-4 w-4" />}
                {label === 'Facebook' && <FacebookIcon className="h-4 w-4" />}
                {label === 'X' && <TwitterIcon className="h-4 w-4" />}
              </motion.a>
            ))}
            <motion.button
              onClick={handleCopy}
              aria-label="Copy link"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/35 text-white transition hover:bg-white hover:text-brand-ink"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Link2 className="h-4 w-4" strokeWidth={2} />}
            </motion.button>
          </div>
        </motion.div>
       </div>

        {/* Lead-capture card (right) */}
        <div className="lg:justify-self-end">
          <HeroLeadCard source="blog-detail" />
        </div>
      </div>
    </section>
  );
}
