// src/components/destinations/DestinationTopAttractions.tsx
'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface Attraction {
  name: string;
  description: string;
}

interface DestinationTopAttractionsProps {
  name: string;
  attractions: Attraction[];
}

export function DestinationTopAttractions({ name, attractions }: DestinationTopAttractionsProps) {
  if (attractions.length === 0) return null;

  return (
    <motion.section
      id="attractions"
      className="rounded-2xl border border-border bg-card p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[17px] font-bold">Top Attractions in {name}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {attractions.map((a, i) => (
          <motion.div
            key={i}
            className="rounded-xl border border-border p-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              <div>
                <p className="text-[13.5px] font-bold">{a.name}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{a.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
