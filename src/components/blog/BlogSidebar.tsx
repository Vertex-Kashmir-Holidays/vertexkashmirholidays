// src/components/sections/BlogSidebar.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface BlogSidebarProps {
  categories: Array<{ name: string; count: number }>;
  trending: Array<{ seed: string; title: string; date: string }>;
}

export function BlogSidebar({ categories, trending }: BlogSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* About Blog */}
      <motion.div
        className="rounded-2xl border border-brand-line bg-white p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-green text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </span>
          <div>
            <h2 className="text-[15px] font-bold">About Our Blog</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-brand-mute">
              We're a team of local travel experts sharing authentic Kashmir experiences, travel guides, and insider tips to help you plan the perfect trip.
            </p>
            <Link
              href="#"
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-green2 hover:underline"
            >
              Learn more about us
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Popular Categories */}
      <motion.div
        className="rounded-2xl border border-brand-line bg-white p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-[16px] font-bold">Popular Categories</h2>
        <ul className="mt-3 divide-y divide-brand-line">
          {categories.map((cat, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href="#"
                className="group flex items-center justify-between py-2.5 text-[13px]"
              >
                <span className="font-medium text-brand-ink/85 transition group-hover:text-brand-green2">
                  {cat.name}
                </span>
                <span className="rounded-full bg-brand-page px-2.5 py-0.5 text-[11px] font-bold text-brand-mute">
                  {cat.count}
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
        <button className="mt-4 w-full rounded-lg border-[1.5px] border-brand-line py-2.5 text-[12.5px] font-bold text-brand-green2 transition hover:border-brand-green2">
          View All Categories
        </button>
      </motion.div>

      {/* Trending Posts */}
      <motion.div
        className="rounded-2xl border border-brand-line bg-white p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-[16px] font-bold">Trending Posts</h2>
        <ul className="mt-4 space-y-4">
          {trending.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href="#" className="group flex items-start gap-3">
                <img
                  src={`https://picsum.photos/seed/${item.seed}/130/100`}
                  alt=""
                  className="h-[52px] w-[68px] shrink-0 rounded-lg object-cover"
                />
                <div className="leading-snug">
                  <p className="text-[12.5px] font-bold transition group-hover:text-brand-green2">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] text-brand-mute">{item.date}</p>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Newsletter */}
      <motion.div
        className="rounded-2xl border border-brand-line bg-brand-page p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-[16px] font-bold">Subscribe to Newsletter</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-brand-mute">
          Get the latest travel tips, exclusive deals, and Kashmir updates.
        </p>
        <form className="mt-4 space-y-2.5" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-brand-line bg-white px-3.5 py-2.5 text-[12.5px] outline-none transition placeholder:text-brand-mute/70 focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
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
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-brand-mute">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-bright" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          No spam. Unsubscribe anytime.
        </p>
      </motion.div>
    </aside>
  );
}