'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TourCard } from '@/components/ui/TourCard';

export function PackagesSection() {
  const pkgs = [
    { badge: 'BESTSELLER', bc: 'orange', seed: 'pkg-honeymoon', t: 'Kashmir Honeymoon Escape', d: '6N / 7D', places: 'Srinagar, Pahalgam, Gulmarg', r: '4.9', n: '852', old: '₹42,999', p: '₹34,999' },
    { badge: 'POPULAR', bc: 'blue', seed: 'pkg-family', t: 'Kashmir Family Snow Special', d: '5N / 6D', places: 'Srinagar, Gulmarg, Sonmarg', r: '4.8', n: '624', old: '₹29,999', p: '₹24,999' },
    { badge: 'TRENDING', bc: 'green', seed: 'pkg-trek', t: 'Kashmir Great Lakes Trek', d: '8N / 9D', places: 'Sonamarg, Nichnai, Gadsar, Vishansar', r: '4.9', n: '412', old: '₹25,999', p: '₹21,999' },
    { badge: 'LUXURY', bc: 'orange', seed: 'pkg-luxury', t: 'Signature Luxury Kashmir', d: '5N / 6D', places: 'Srinagar, Pahalgam, Gulmarg', r: '4.9', n: '236', old: '₹74,999', p: '₹59,999' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section id="packages" className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.p
            className="rv text-[11px] font-bold tracking-[0.22em] text-green-glow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            BESTSELLERS
          </motion.p>
          <motion.h2
            className="rv h-display mt-3 text-4xl font-bold text-white"
            style={{ '--rd': '0.08s' } as any}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Handpicked Kashmir packages
          </motion.h2>
          <motion.p
            className="rv mt-3 max-w-md text-sm text-white/60"
            style={{ '--rd': '0.14s' } as any}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Fine-tuned by locals, loved by 12,000+ travellers.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link href="#" className="rv inline-flex items-center gap-1.5 text-sm font-bold text-green-glow hover:underline">
            View All Packages →
          </Link>
        </motion.div>
      </div>

      <motion.div
        className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {pkgs.map((p, i) => (
          <TourCard key={i} tour={p} index={i} variant="home" />
        ))}
      </motion.div>
    </section>
  );
}