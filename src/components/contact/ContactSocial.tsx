// src/components/contact/ContactSocial.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { ContactSocialContent, ContactSocialLink } from '@/types/contact';

interface ContactSocialProps {
  content: ContactSocialContent;
  socials: ContactSocialLink[];
}

// Brand colours are intentionally fixed in both themes.
const SOCIAL_META: Record<
  ContactSocialLink['type'],
  { label: string; bg: string; icon: string; stroke: boolean }
> = {
  instagram: {
    label: 'Instagram',
    bg: 'bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500',
    icon: 'M3 3h18v18H3ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM18 6h.01',
    stroke: true,
  },
  facebook: {
    label: 'Facebook',
    bg: 'bg-[#1877f2]',
    icon: 'M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1Z',
    stroke: false,
  },
  youtube: {
    label: 'YouTube',
    bg: 'bg-[#ff0000]',
    icon: 'M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8ZM10 15.2V8.8l5.2 3.2Z',
    stroke: false,
  },
  whatsapp: {
    label: 'WhatsApp',
    bg: 'bg-[#25D366]',
    icon: 'M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z',
    stroke: false,
  },
  twitter: {
    label: 'X',
    bg: 'bg-foreground',
    icon: 'm4 4 6.8 8.5L4.4 20h2.3l5.1-6 4.8 6H20l-7-8.8L19.2 4H17l-4.6 5.4L8 4Z',
    stroke: false,
  },
};

const igImages = ['ig-shikara', 'ig-boat', 'ig-snow', 'ig-tulip'];

export function ContactSocial({ content, socials }: ContactSocialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">{content.kicker}</p>
      <h2 className="h-display mt-2 font-display text-[22px] font-bold">{content.title}</h2>
      {socials.length > 0 && (
        <div className="mt-5 flex gap-2.5">
          {socials.map((s) => {
            const meta = SOCIAL_META[s.type];
            const textClass = s.type === 'twitter' ? 'text-background' : 'text-white';
            return (
              <a
                key={s.type}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={meta.label}
                className={`grid h-11 w-11 place-items-center rounded-xl ${meta.bg} ${textClass} shadow-soft transition hover:scale-105`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill={meta.stroke ? 'none' : 'currentColor'} stroke={meta.stroke ? 'currentColor' : 'none'} strokeWidth={meta.stroke ? '1.8' : '0'}>
                  <path d={meta.icon} />
                </svg>
              </a>
            );
          })}
        </div>
      )}
      {content.text && <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">{content.text}</p>}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {igImages.map((s, i) => (
          <a key={i} href={content.ctaHref ?? '#'} className="group block aspect-square overflow-hidden rounded-lg">
            <img
              src={`https://picsum.photos/seed/${s}/200`}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            />
          </a>
        ))}
      </div>
      {content.ctaLabel && (
        <Link href={content.ctaHref ?? '#'} className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary hover:underline">
          {content.ctaLabel}
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      )}
    </motion.div>
  );
}
