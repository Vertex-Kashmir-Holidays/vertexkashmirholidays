// src/components/contact/ContactReachCards.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Phone, Mail, MapPin, ArrowRight, type LucideIcon } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/brand';
import type { ContactReachCardData, ContactSectionHeading } from '@/types/contact';

interface ContactReachCardsProps {
  heading: ContactSectionHeading;
  cards: ContactReachCardData[];
}

// Channel → icon. WhatsApp keeps its brand glyph; the rest use lucide.
const ICONS: Record<ContactReachCardData['type'], LucideIcon | typeof WhatsAppIcon> = {
  whatsapp: WhatsAppIcon,
  call: Phone,
  email: Mail,
  visit: MapPin,
};

export function ContactReachCards({ heading, cards }: ContactReachCardsProps) {
  return (
    <div className="min-w-0">
      <motion.p
        className="text-[11.5px] font-bold tracking-[0.22em] text-primary"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {heading.kicker}
      </motion.p>
      <motion.h2
        className="h-display mt-2 font-display text-[17px] font-bold"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {heading.title}
      </motion.h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = ICONS[card.type];
          const isWa = card.type === 'whatsapp';
          return (
            <motion.article
              key={card.type}
              className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <span className={`grid h-14 w-14 place-items-center rounded-full ${isWa ? 'bg-[#25D366] text-white' : 'bg-primary/10 text-primary'}`}>
                <Icon className="h-7 w-7" strokeWidth={1.7} />
              </span>
              <p className="mt-3.5 text-[14.5px] font-bold">{card.title}</p>
              <p className="mt-1.5 break-all text-[12.5px] font-semibold text-foreground/85">{card.value}</p>
              <p className="mt-2 flex-1 text-[11.5px] leading-relaxed text-muted-foreground">{card.subtitle}</p>
              <Link
                href={card.href}
                target='_blank'
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[11.5px] font-bold text-primary-foreground transition hover:brightness-110"
              >
                {card.cta}
                <ArrowRight className="h-3 w-3" strokeWidth={2.6} />
              </Link>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
