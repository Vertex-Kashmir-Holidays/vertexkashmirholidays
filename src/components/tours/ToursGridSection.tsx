'use client';

import { TourCard } from '@/components/ui/TourCard';
import { motion } from 'framer-motion';

interface ToursGridSectionProps {
  onFilterToggle?: () => void;
}

export function ToursGridSection({ onFilterToggle }: ToursGridSectionProps) {
  const tours = [
    { badge: 'BESTSELLER', bc: 'orange', seed: 'pkg-honeymoon', t: 'Kashmir Honeymoon Escape', d: '6N / 7D', places: 'Srinagar, Pahalgam, Gulmarg', r: '4.9', n: '852', old: '₹39,999', p: '₹34,999' },
    { badge: 'POPULAR', bc: 'blue', seed: 'pkg-family', t: 'Kashmir Family Snow Special', d: '5N / 6D', places: 'Srinagar, Gulmarg, Sonmarg', r: '4.8', n: '624', old: '₹28,999', p: '₹24,999' },
    { badge: 'TRENDING', bc: 'green', seed: 'pkg-trek', t: 'Kashmir Great Lakes Trek', d: '8N / 9D', places: 'Sonamarg, Nichnai, Gadsar, Vishansar', r: '4.9', n: '412', old: '₹24,999', p: '₹21,999' },
    { badge: '10% OFF', bc: 'orange', seed: 'pkg-luxury', t: 'Signature Luxury Kashmir', d: '5N / 6D', places: 'Srinagar, Pahalgam, Gulmarg', r: '4.9', n: '236', old: '₹66,999', p: '₹59,999' },
    { badge: 'NEW', bc: 'green', seed: 'pkg-pahalgam', t: 'Pahalgam Valley Retreat', d: '4N / 5D', places: 'Pahalgam, Aru, Betaab Valley', r: '4.7', n: '189', p: '₹18,999' },
    { badge: 'POPULAR', bc: 'blue', seed: 'pkg-shikara', t: 'Srinagar Shikara Experience', d: '3N / 4D', places: 'Srinagar, Dal Lake, Mughal Gardens', r: '4.6', n: '215', p: '₹15,999' },
    { badge: 'BESTSELLER', bc: 'orange', seed: 'pkg-gulmarg', t: 'Gulmarg Adventure Getaway', d: '4N / 5D', places: 'Gulmarg, Apharwat, Khilanmarg', r: '4.8', n: '328', p: '₹22,999' },
    { badge: 'TRENDING', bc: 'green', seed: 'pkg-sonmarg', t: 'Sonmarg Autumn Special', d: '3N / 4D', places: 'Sonmarg, Thajiwas Glacier', r: '4.6', n: '156', p: '₹16,999' },
  ] as const;

  const pagination = ['‹', '1', '2', '3', '4', '…', '8', '›'];

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
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <motion.h2
          className="h-display text-[26px] font-bold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          All Tours <span className="font-sans text-[13px] font-semibold text-brand-green2">(48 Packages)</span>
        </motion.h2>
        
        <div className="flex items-center gap-2.5 text-[13px]">
          {/* Mobile Filter Button */}
          <button
            onClick={onFilterToggle}
            className="flex items-center gap-1.5 rounded-lg border border-brand-line bg-white px-3.5 py-2 font-semibold shadow-soft lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 21V14" />
              <path d="M4 10V3" />
              <path d="M12 21V12" />
              <path d="M12 8V3" />
              <path d="M20 21V16" />
              <path d="M20 12V3" />
              <path d="M1 14h6" />
              <path d="M9 8h6" />
              <path d="M17 16h6" />
            </svg>
            <span>Filters</span>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-green text-[10px] font-bold text-white">3</span>
          </button>

          <span className="text-brand-mute hidden sm:inline">Sort by:</span>
          <motion.button
            className="flex items-center gap-2 rounded-lg border border-brand-line bg-white px-3.5 py-2 font-semibold shadow-soft"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Popular
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.button>
        </div>
      </div>

      <motion.div
        className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {tours.map((t, i) => (
          <TourCard key={i} tour={t} index={i} variant="tours" />
        ))}
      </motion.div>

      <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
        {pagination.map((p, i) => {
          if (p === '‹' || p === '›') {
            return (
              <motion.button
                key={i}
                aria-label={`${p === '‹' ? 'Previous' : 'Next'} page`}
                className="grid h-10 w-10 place-items-center rounded-full border border-brand-line bg-white text-brand-mute shadow-soft transition-all duration-200 hover:border-brand-green2 hover:text-brand-green2 hover:shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {p}
              </motion.button>
            );
          }
          if (p === '…') {
            return (
              <span key={i} className="px-1 text-brand-mute">
                …
              </span>
            );
          }
          const active = p === '1';
          return (
            <motion.button
              key={i}
              className={`${
                active
                  ? 'bg-brand-green text-white shadow-card'
                  : 'border border-brand-line bg-white text-brand-ink shadow-soft hover:border-brand-green2 hover:text-brand-green2'
              } grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold transition-all duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {p}
            </motion.button>
          );
        })}
      </nav>
    </section>
  );
}