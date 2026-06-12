'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ToursFiltersSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function ToursFiltersSidebar({ isMobileOpen = false, onClose }: ToursFiltersSidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const categories = [
    { e: '❤️', t: 'Honeymoon', n: 12, on: true },
    { e: '👨‍👩‍👧', t: 'Family', n: 15 },
    { e: '🏔️', t: 'Adventure', n: 11 },
    { e: '👑', t: 'Luxury', n: 10 },
  ];

  const durations = [
    ['1 – 3 Days', 6],
    ['4 – 6 Days', 18],
    ['7 – 10 Days', 16],
    ['10+ Days', 8],
  ];

  const difficulties = [
    ['Easy', 20],
    ['Moderate', 18],
    ['Tough', 10],
  ];

  const moreFilters = ['Best Time', 'Group Size', 'Start City', 'Destinations'];

  // Desktop sidebar
  const DesktopSidebar = () => (
    <motion.aside
      className="h-fit rounded-2xl border border-brand-line bg-white p-5 shadow-soft"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Search */}
      <p className="text-[15px] font-bold">Search</p>
      <label className="mt-3 flex items-center gap-2 rounded-lg bg-brand-page px-3.5 py-2.5">
        <input
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-brand-mute"
          placeholder="Search tours..."
        />
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4-4" />
        </svg>
      </label>

      {/* Categories */}
      <div className="mt-7">
        <p className="text-[15px] font-bold">Categories</p>
        <ul className="mt-3.5 space-y-3 text-[13px]">
          {categories.map((c, i) => (
            <motion.li
              key={i}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <input type="checkbox" className="cbx" defaultChecked={c.on} id={`cat-${c.t}`} />
              <label htmlFor={`cat-${c.t}`} className="flex w-full cursor-pointer items-center gap-2 text-brand-ink/85">
                <span className="text-[13px]">{c.e}</span>
                {c.t}
              </label>
              <span className="text-[12px] text-brand-mute">{c.n}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Duration */}
      <div className="mt-7 border-t border-brand-line pt-6">
        <p className="text-[15px] font-bold">Duration (Days)</p>
        <ul className="mt-3.5 space-y-3 text-[13px]">
          {durations.map(([t, n], i) => (
            <motion.li
              key={i}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.2 }}
            >
              <input type="checkbox" className="cbx" id={`dur-${i}`} />
              <label htmlFor={`dur-${i}`} className="w-full cursor-pointer text-brand-ink/85">
                {t}
              </label>
              <span className="text-[12px] text-brand-mute">{n}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div className="mt-7 border-t border-brand-line pt-6">
        <p className="text-[15px] font-bold">
          Price Range <span className="text-[11px] font-medium text-brand-mute">(per person)</span>
        </p>
        <div className="range-track mt-5">
          <div className="range-fill"></div>
          <motion.span
            className="thumb"
            style={{ left: '2%' }}
            whileHover={{ scale: 1.2 }}
          ></motion.span>
          <motion.span
            className="thumb"
            style={{ left: '98%' }}
            whileHover={{ scale: 1.2 }}
          ></motion.span>
        </div>
        <div className="mt-3 flex justify-between text-[12px] font-semibold text-brand-ink/80">
          <span>₹5,000</span>
          <span>₹1,00,000+</span>
        </div>
      </div>

      {/* Difficulty */}
      <div className="mt-7 border-t border-brand-line pt-6">
        <p className="text-[15px] font-bold">Difficulty Level</p>
        <ul className="mt-3.5 space-y-3 text-[13px]">
          {difficulties.map(([t, n], i) => (
            <motion.li
              key={i}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.4 }}
            >
              <input type="checkbox" className="cbx" id={`diff-${i}`} />
              <label htmlFor={`diff-${i}`} className="w-full cursor-pointer text-brand-ink/85">
                {t}
              </label>
              <span className="text-[12px] text-brand-mute">{n}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* More Filters */}
      <div className="mt-7 border-t border-brand-line pt-6">
        <p className="text-[15px] font-bold">More Filters</p>
        <ul className="mt-2 divide-y divide-brand-line text-[13px] font-medium text-brand-ink/85">
          {moreFilters.map((t, i) => (
            <motion.li key={i} whileHover={{ x: 5 }}>
              <button className="flex w-full items-center justify-between py-3 transition hover:text-brand-green2">
                {t}
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.button
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-brand-green2 py-2.5 text-[13px] font-semibold text-brand-green2 transition hover:bg-brand-green2 hover:text-white"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Clear Filters
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />
        </svg>
      </motion.button>
    </motion.aside>
  );

  // Mobile drawer
  const MobileDrawer = () => (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-full max-w-[320px] overflow-y-auto bg-white shadow-2xl lg:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-line bg-white p-4">
              <h3 className="text-[17px] font-bold">Filters</h3>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-brand-page"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5">
              {/* Search */}
              <p className="text-[15px] font-bold">Search</p>
              <label className="mt-3 flex items-center gap-2 rounded-lg bg-brand-page px-3.5 py-2.5">
                <input
                  className="w-full bg-transparent text-[13px] outline-none placeholder:text-brand-mute"
                  placeholder="Search tours..."
                />
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4-4" />
                </svg>
              </label>

              {/* Categories */}
              <div className="mt-7">
                <p className="text-[15px] font-bold">Categories</p>
                <ul className="mt-3.5 space-y-3 text-[13px]">
                  {categories.map((c, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <input type="checkbox" className="cbx" defaultChecked={c.on} id={`cat-${c.t}`} />
                      <label htmlFor={`cat-${c.t}`} className="flex w-full cursor-pointer items-center gap-2 text-brand-ink/85">
                        <span className="text-[13px]">{c.e}</span>
                        {c.t}
                      </label>
                      <span className="text-[12px] text-brand-mute">{c.n}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Duration */}
              <div className="mt-7 border-t border-brand-line pt-6">
                <p className="text-[15px] font-bold">Duration (Days)</p>
                <ul className="mt-3.5 space-y-3 text-[13px]">
                  {durations.map(([t, n], i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.2 }}
                    >
                      <input type="checkbox" className="cbx" id={`dur-${i}`} />
                      <label htmlFor={`dur-${i}`} className="w-full cursor-pointer text-brand-ink/85">
                        {t}
                      </label>
                      <span className="text-[12px] text-brand-mute">{n}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Price */}
              <div className="mt-7 border-t border-brand-line pt-6">
                <p className="text-[15px] font-bold">
                  Price Range <span className="text-[11px] font-medium text-brand-mute">(per person)</span>
                </p>
                <div className="range-track mt-5">
                  <div className="range-fill"></div>
                  <motion.span
                    className="thumb"
                    style={{ left: '2%' }}
                    whileHover={{ scale: 1.2 }}
                  ></motion.span>
                  <motion.span
                    className="thumb"
                    style={{ left: '98%' }}
                    whileHover={{ scale: 1.2 }}
                  ></motion.span>
                </div>
                <div className="mt-3 flex justify-between text-[12px] font-semibold text-brand-ink/80">
                  <span>₹5,000</span>
                  <span>₹1,00,000+</span>
                </div>
              </div>

              {/* Difficulty */}
              <div className="mt-7 border-t border-brand-line pt-6">
                <p className="text-[15px] font-bold">Difficulty Level</p>
                <ul className="mt-3.5 space-y-3 text-[13px]">
                  {difficulties.map(([t, n], i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.4 }}
                    >
                      <input type="checkbox" className="cbx" id={`diff-${i}`} />
                      <label htmlFor={`diff-${i}`} className="w-full cursor-pointer text-brand-ink/85">
                        {t}
                      </label>
                      <span className="text-[12px] text-brand-mute">{n}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* More Filters */}
              <div className="mt-7 border-t border-brand-line pt-6">
                <p className="text-[15px] font-bold">More Filters</p>
                <ul className="mt-2 divide-y divide-brand-line text-[13px] font-medium text-brand-ink/85">
                  {moreFilters.map((t, i) => (
                    <motion.li key={i} whileHover={{ x: 5 }}>
                      <button className="flex w-full items-center justify-between py-3 transition hover:text-brand-green2">
                        {t}
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <motion.button
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-brand-green2 py-2.5 text-[13px] font-semibold text-brand-green2 transition hover:bg-brand-green2 hover:text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
              >
                Clear Filters
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return isMobile ? <MobileDrawer /> : <DesktopSidebar />;
}