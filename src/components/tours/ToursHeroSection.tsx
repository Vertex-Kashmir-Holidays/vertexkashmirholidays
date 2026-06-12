'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function ToursHeroSection() {
  const stats = [
    { label: 'Curated Trips', value: '500+', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', icon2: 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8', icon3: 'M22 21v-2a4 4 0 0 0-3-3.9' },
    { label: 'Happy Travellers', value: '12,000+', icon: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8', icon2: 'M4 21a8 8 0 0 1 16 0' },
    { label: 'Years on Ground', value: '15+', icon: 'M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18', icon2: 'M12 7v5l3 3' },
    { label: 'Average Rating', value: '4.9/5', icon: 'M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative overflow-hidden">
      <motion.img
        src="https://picsum.photos/seed/tours-hero/1800/600"
        alt="Kashmir valley"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/50 to-transparent"></div>
      
      <div className="relative mx-auto max-w-[1300px] px-6 py-16 lg:pb-20 lg:pt-28">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] text-white/80" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <span>›</span>
          <Link href="/tours" className="transition hover:text-white">Tours</Link>
        </nav>

        {/* Title Block */}
        <div className="mt-6">
          <motion.h1
            className="h-display text-4xl font-bold text-white lg:text-[44px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Kashmir Tour Packages
          </motion.h1>
          <motion.p
            className="mt-3 text-[15px] text-white/85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Handpicked experiences by locals, crafted with love.
          </motion.p>
        </div>

        {/* Stats */}
        <motion.div
          className="mt-9 flex flex-wrap gap-x-12 gap-y-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="flex items-center gap-3 text-white">
              <motion.svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-emerald-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <path d={stat.icon} />
                {stat.icon2 && <path d={stat.icon2} />}
                {stat.icon3 && <path d={stat.icon3} />}
              </motion.svg>
              <div>
                <p className="text-[17px] font-bold leading-tight">{stat.value}</p>
                <p className="text-[12px] text-white/70">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}