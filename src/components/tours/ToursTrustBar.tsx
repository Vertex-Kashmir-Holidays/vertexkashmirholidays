'use client';

import { motion, type Variants } from 'framer-motion';

export function ToursTrustBar() {
  const trustItems = [
    {
      t: 'Best Price Guarantee',
      s: 'No hidden charges',
      icon: (
        <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
      ),
      icon2: <path d="m9 12 2 2 4-4" />,
    },
    {
      t: '24/7 On-ground Support',
      s: "We're with you always",
      icon: <path d="M3 12a9 9 0 1 1 18 0v5a2 2 0 0 1-2 2h-3v-6h5M3 12v5a2 2 0 0 0 2 2h3v-6H3" />,
    },
    {
      t: 'Customised Itineraries',
      s: 'Made just for you',
      icon: (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </>
      ),
    },
    {
      t: 'Secure Payments',
      s: 'Powered by Razorpay',
      icon: (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.section
      className="bg-muted"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="mx-auto grid max-w-[1180px] gap-7 px-6 py-9 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {trustItems.map((x, i) => (
          <motion.div key={i} variants={itemVariants} className="flex items-center gap-3.5">
            <motion.span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card text-primary shadow-soft"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {x.icon}
                {x.icon2 && x.icon2}
              </svg>
            </motion.span>
            <div>
              <p className="text-[13.5px] font-bold">{x.t}</p>
              <p className="text-[12px] text-muted-foreground">{x.s}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}