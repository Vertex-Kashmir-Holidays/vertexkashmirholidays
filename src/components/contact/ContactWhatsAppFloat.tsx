// src/components/contact/ContactWhatsAppFloat.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface ContactWhatsAppFloatProps {
  text: string;
  href: string;
}

export function ContactWhatsAppFloat({ text, href }: ContactWhatsAppFloatProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="rounded-full bg-card px-4 py-2 text-[12px] font-semibold text-foreground shadow-card">{text}</span>
      <motion.span
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-card transition hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z" />
        </svg>
      </motion.span>
    </Link>
  );
}
