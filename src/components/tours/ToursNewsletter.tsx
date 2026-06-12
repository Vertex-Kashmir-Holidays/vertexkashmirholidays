'use client';

import { motion } from 'framer-motion';

export function ToursNewsletter() {
  return (
    <section className="relative overflow-hidden">
      <motion.img
        src="https://picsum.photos/seed/news-mtn/1800/420"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-brand-green/90"></div>
      <div className="relative mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="h-display text-[26px] font-bold text-white">Don't miss our best deals!</h2>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/80">
            Subscribe to get early access to exclusive offers and Kashmir travel tips.
          </p>
        </motion.div>
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex overflow-hidden rounded-lg bg-white p-1 shadow-card">
            <input
              className="w-full px-4 text-[13px] outline-none placeholder:text-brand-mute"
              placeholder="Enter your email address"
            />
            <motion.button
              className="shrink-0 rounded-md bg-brand-bright px-5 py-3 text-[13px] font-bold text-white transition hover:brightness-110"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Subscribe Now
            </motion.button>
          </div>
          <p className="mt-2.5 text-[11px] text-white/70">No spam. Unsubscribe anytime.</p>
        </motion.div>
      </div>
    </section>
  );
}