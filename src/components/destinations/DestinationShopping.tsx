// src/components/destinations/DestinationShopping.tsx
'use client';

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

interface ShopItem {
  name: string;
  description: string;
}

interface DestinationShoppingProps {
  items: ShopItem[];
}

export function DestinationShopping({ items }: DestinationShoppingProps) {
  if (items.length === 0) return null;

  return (
    <motion.section
      id="shopping"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[18px] font-bold">Shopping</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <motion.div
            key={i}
            className="rounded-xl border border-border p-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start gap-2.5">
              <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" strokeWidth={2} />
              <div>
                <p className="text-[14px] font-bold">{item.name}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
