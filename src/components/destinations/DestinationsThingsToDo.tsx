// src/components/sections/DestinationsThingsToDo.tsx
"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { EASE_BRAND } from "@/lib/motion";
import {
  Sailboat,
  CableCar,
  Snowflake,
  MountainSnow,
  Flower2,
  ArrowRight,
} from "lucide-react";

export function DestinationsThingsToDo() {
  const things = [
    { t: "Shikara Ride", s: "Dal Lake", Icon: Sailboat, href: "/activities/shikara-ride" },
    { t: "Gondola Ride", s: "Gulmarg", Icon: CableCar, href: "/activities/gulmarg-gondola-ride" },
    { t: "Skiing", s: "Winter Sports", Icon: Snowflake, href: "/activities/skiing-in-gulmarg" },
    { t: "Gulmarg", s: "Ski Resort", Icon: MountainSnow, href: "/destinations/gulmarg" },
    { t: "Mughal Gardens", s: "Heritage", Icon: Flower2, href: "/destinations/srinagar" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: EASE_BRAND },
    },
  };

  return (
    <div className="mx-auto max-w-[1300px] px-6 py-12">
      <motion.h2
        className="text-[22px] font-bold text-primary"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Popular things to do in Kashmir
      </motion.h2>
      <motion.div
        className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {things.map((thing, i) => (
          <motion.a
            key={i}
            href={thing.href}
            variants={itemVariants}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-3 shadow-soft transition hover:-translate-y-0.5 hover:border-primary hover:shadow-card"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <thing.Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </span>
            <span className="leading-tight">
              <span className="block text-[14px] font-bold">{thing.t}</span>
              <span className="block text-[12px] text-muted-foreground">{thing.s}</span>
            </span>
          </motion.a>
        ))}
      </motion.div>
      <div className="mt-4 flex justify-end">
        <Link
          href="/activities"
          className="flex items-center gap-1.5 text-[14px] font-bold text-primary hover:underline"
        >
          View all experiences
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  );
}
