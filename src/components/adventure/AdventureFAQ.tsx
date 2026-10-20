// src/components/adventure/AdventureFAQ.tsx
"use client";

import { motion } from "framer-motion";
import type { AdventureFaq } from "@/types/adventure";
import { FaqPreviewList } from "@/components/faqs/FaqPreviewList";

interface AdventureFAQProps {
  title: string | null;
  faqs: AdventureFaq[];
}

export function AdventureFAQ({ title, faqs }: AdventureFAQProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[760px] px-6 pt-20">
      {title && (
        <motion.h2
          className="h-display text-center text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
      )}
      <div className="mt-9">
        <FaqPreviewList faqs={faqs} />
      </div>
    </section>
  );
}
