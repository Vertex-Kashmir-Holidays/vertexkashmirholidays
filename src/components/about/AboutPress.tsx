// src/components/about/AboutPress.tsx
"use client";

import { motion } from "framer-motion";

interface AboutPressProps {
  label: string | null;
  items: string[];
}

export function AboutPress({ label, items }: AboutPressProps) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1300px] px-6 pb-14">
      <motion.div
        className="flex flex-wrap items-center gap-x-10 gap-y-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-[12px] font-bold tracking-[0.22em] text-foreground/70">{label}</p>
        <div className="flex flex-1 flex-wrap items-center justify-between gap-x-10 gap-y-5 opacity-80 grayscale">
          {items.map((item, i) => (
            <motion.span
              key={i}
              className="text-foreground/80"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
