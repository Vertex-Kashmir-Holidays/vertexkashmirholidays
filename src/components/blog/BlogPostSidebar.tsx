// src/components/sections/BlogPostSidebar.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface BlogPostSidebarProps {
  toc: Array<{ label: string; href: string }>;
  author: {
    name: string;
    role: string;
    bio: string;
    avatar: string;
  };
  relatedTour?: {
    label: string;
    seed: string;
    name: string;
    duration: string;
    price: string;
    oldPrice?: string;
    off?: string;
    route: string;
    rating: string;
    reviews: string;
    note: string;
  };
}

export function BlogPostSidebar({ toc, author, relatedTour }: BlogPostSidebarProps) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      {/* TOC */}
      <motion.div
        className="rounded-2xl border border-brand-line bg-white p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-[15.5px] font-bold">On This Page</h2>
        <ul className="mt-3.5 space-y-2.5 text-[12.5px]">
          {toc.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                className="group flex items-center gap-2.5 font-medium text-brand-ink/80 transition hover:text-brand-green2"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-bright"></span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Related Tour Widget */}
      {relatedTour && (
        <motion.div
          id="tourCard"
          className="scroll-mt-24 rounded-2xl border border-brand-line bg-white p-5 shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-[15.5px] font-bold">{relatedTour.label}</h2>
          <img
            src={`https://picsum.photos/seed/${relatedTour.seed}/480/300`}
            alt={relatedTour.name}
            className="mt-4 h-[140px] w-full rounded-xl object-cover"
          />
          <h3 className="mt-4 text-[16px] font-bold leading-snug">{relatedTour.name}</h3>
          <p className="text-[13px] font-semibold text-brand-mute">{relatedTour.duration}</p>
          <p className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="text-[18px] font-extrabold">{relatedTour.price}</span>
            <span className="text-[12px] text-brand-mute">/ person</span>
            {relatedTour.oldPrice && (
              <span className="text-[12px] text-brand-mute line-through">{relatedTour.oldPrice}</span>
            )}
            {relatedTour.off && (
              <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {relatedTour.off}
              </span>
            )}
          </p>
          <ul className="mt-3.5 space-y-2 text-[12px] text-brand-ink/80">
            <li className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-brand-green2" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {relatedTour.route}
            </li>
            <li className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-amber-400" fill="currentColor">
                <path d="m12 2 3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1Z" />
              </svg>
              {relatedTour.rating} ★ ({relatedTour.reviews})
            </li>
            <li className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-brand-green2" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="m9 12 2 2 4-5" />
              </svg>
              {relatedTour.note}
            </li>
          </ul>
          <Link
            href="#"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-brand-green py-3 text-[13px] font-bold text-white shadow-soft transition hover:brightness-110"
          >
            View Details
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link href="#" className="mt-3 block text-center text-[12.5px] font-bold text-brand-green2 underline-offset-2 hover:underline">
            Customize this trip
          </Link>
        </motion.div>
      )}

      {/* Newsletter */}
      <motion.div
        className="rounded-2xl bg-emerald-50 p-5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-[15.5px] font-bold text-emerald-950">
          Get Kashmir stories in your inbox
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed text-emerald-900/75">
          Weekly travel tips, exclusive deals, and hidden gems — straight from the valley.
        </p>
        <form className="mt-3.5 space-y-2.5" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-emerald-200 bg-white px-3.5 py-2.5 text-[12.5px] outline-none transition placeholder:text-brand-mute/70 focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
            placeholder="Enter your email"
          />
          <motion.button
            className="w-full rounded-lg bg-brand-green py-2.5 text-[12.5px] font-bold text-white transition hover:brightness-110"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Subscribe
          </motion.button>
        </form>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-900/65">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          No spam. Unsubscribe anytime.
        </p>
      </motion.div>

      {/* Author Card */}
      <motion.div
        className="rounded-2xl border border-brand-line bg-white p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-[15.5px] font-bold">About the Author</h2>
        <div className="mt-4 flex items-start gap-3.5">
          <img
            src={author.avatar}
            alt={author.name}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
          <div>
            <p className="text-[14px] font-bold">{author.name}</p>
            <p className="text-[11.5px] font-semibold text-brand-green2">{author.role}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-brand-mute">{author.bio}</p>
            <div className="mt-3 flex gap-2">
              {['Instagram', 'Facebook', 'YouTube', 'WhatsApp'].map((s, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={s}
                  className="grid h-7 w-7 place-items-center rounded-full border border-brand-line text-brand-mute transition hover:border-brand-green2 hover:text-brand-green2"
                >
                  <span className="text-[10px] font-bold">{s[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </aside>
  );
}