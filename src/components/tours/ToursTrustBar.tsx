"use client";

import { motion, type Variants } from "framer-motion";
import { ShieldCheck, Headphones, PenLine, Lock } from "lucide-react";

export function ToursTrustBar() {
  const trustItems = [
    { t: "Best Price Guarantee", s: "No hidden charges", Icon: ShieldCheck },
    { t: "24/7 On-ground Support", s: "We're with you always", Icon: Headphones },
    { t: "Customised Itineraries", s: "Made just for you", Icon: PenLine },
    { t: "Secure Payments", s: "Powered by Razorpay", Icon: Lock },
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
        className="mx-auto grid max-w-[1180px] gap-7 px-4 py-9 sm:grid-cols-2 sm:px-6 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {trustItems.map((x, i) => (
          <motion.div key={i} variants={itemVariants} className="flex items-center gap-3.5">
            <motion.span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card text-primary shadow-soft"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <x.Icon className="h-5 w-5" strokeWidth={1.8} />
            </motion.span>
            <div>
              <p className="text-[14px] font-bold">{x.t}</p>
              <p className="text-[14px] text-muted-foreground">{x.s}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
