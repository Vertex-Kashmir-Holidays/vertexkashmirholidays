// src/components/contact/ContactWhatsAppFloat.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/icons/brand';
import { trackWhatsappClick } from '@/lib/analytics';

interface ContactWhatsAppFloatProps {
  text: string;
  href: string;
}

export function ContactWhatsAppFloat({ text, href }: ContactWhatsAppFloatProps) {
  return (
    <Link
      href={href}
      target="_blank"
      onClick={() => trackWhatsappClick('float')}
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="rounded-full bg-card px-4 py-2 text-[14px] font-semibold text-foreground shadow-card">{text}</span>
      <motion.span
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-card transition hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <WhatsAppIcon className="h-7 w-7" />
      </motion.span>
    </Link>
  );
}
