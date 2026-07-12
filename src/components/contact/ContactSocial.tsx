// src/components/contact/ContactSocial.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { InstagramIcon, FacebookIcon, YoutubeIcon, WhatsAppIcon, TwitterIcon } from '@/components/icons/brand';
import type { ContactSocialContent, ContactSocialLink } from '@/types/contact';
import { imgSrc } from '@/lib/placeholder';

interface ContactSocialProps {
  content: ContactSocialContent;
  socials: ContactSocialLink[];
}

// Brand colours are intentionally fixed in both themes.
const SOCIAL_META: Record<
  ContactSocialLink['type'],
  { label: string; bg: string; Icon: typeof WhatsAppIcon }
> = {
  instagram: {
    label: 'Instagram',
    bg: 'bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500',
    Icon: InstagramIcon,
  },
  facebook: { label: 'Facebook', bg: 'bg-[#1877f2]', Icon: FacebookIcon },
  youtube: { label: 'YouTube', bg: 'bg-[#ff0000]', Icon: YoutubeIcon },
  whatsapp: { label: 'WhatsApp', bg: 'bg-[#25D366]', Icon: WhatsAppIcon },
  twitter: { label: 'X', bg: 'bg-foreground', Icon: TwitterIcon },
};

const IG_COUNT = 4;

export function ContactSocial({ content, socials }: ContactSocialProps) {
  // Resolve Instagram href — prefer the social link, fall back to ctaHref
  const igHref =
    socials.find((s) => s.type === 'instagram')?.href ??
    content.ctaHref ??
    '#';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">{content.kicker}</p>
      <h2 className="h-display mt-2 font-display text-[17px] font-bold">{content.title}</h2>
      {socials.length > 0 && (
        <div className="mt-5 flex gap-2.5">
          {socials.map((s) => {
            const meta = SOCIAL_META[s.type];
            const Icon = meta.Icon;
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
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
        </div>
      )}
      {content.text && <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">{content.text}</p>}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {Array.from({ length: IG_COUNT }, (_, i) => (
          <a
            key={i}
            href={igHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on Instagram"
            className="group relative block aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={imgSrc(null)}
              alt=""
              fill
              sizes="(max-width: 768px) 25vw, 80px"
              className="object-cover transition duration-500 group-hover:scale-110"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/0 transition duration-300 group-hover:bg-black/40">
              <InstagramIcon className="h-5 w-5 text-white opacity-0 transition duration-300 group-hover:opacity-100" />
            </span>
          </a>
        ))}
      </div>
      {content.ctaLabel && (
        <Link href={content.ctaHref ?? '#'} className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary hover:underline">
          {content.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </Link>
      )}
    </motion.div>
  );
}
