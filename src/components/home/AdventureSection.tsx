'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import { Tilt3D } from '@/components/ui/3DTilt';
import { Clock, Flame, Tag } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/brand';
import { formatINR, renderAccents } from '@/lib/accents';
import { imgSrc } from '@/lib/placeholder';
import { useWhatsAppLink } from '@/components/providers/SiteSettingsProvider';
import type { OfferData, SectionHeading } from '@/types/home';

interface AdventureSectionProps {
  heading: SectionHeading;
  offers: OfferData[];
}

function AdventureCard({ offer, index }: { offer: OfferData; index: number }) {
  const wa = useWhatsAppLink();
  const whatsappHref = wa(
    `Hi! I'm interested in the "${offer.title}" adventure. Could you share availability and confirm the pricing?`,
  );

  const discountPct =
    offer.price > 0 && offer.oldPrice && offer.oldPrice > offer.price
      ? Math.round((1 - offer.price / offer.oldPrice) * 100)
      : null;

  const isSeatsLimited =
    offer.endsText?.toLowerCase().includes('seat') ||
    offer.endsText?.toLowerCase().includes('left');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Tilt3D intensity={6}>
        <article className="group flex flex-col overflow-hidden rounded-2xl border border-orange-200/60 bg-gradient-to-br from-amber-50/80 to-card shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-brand/15 dark:border-orange-900/40 dark:from-orange-950/30">
          {/* Image */}
          <div className="relative h-44 overflow-hidden">
            <Link href={offer.ctaHref ?? '#'} aria-label={offer.title} className="block h-full w-full">
              <Image
                src={imgSrc(offer.image)}
                alt={offer.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </Link>

            {offer.badge && (
              <motion.span
                className="absolute left-3 top-3 rounded-md bg-orange-600 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white shadow-lg"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: index * 0.05 + 0.3 }}
              >
                {offer.badge}
              </motion.span>
            )}

            {discountPct && (
              <span className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-extrabold text-white shadow">
                <Flame className="h-3 w-3" />
                Save {discountPct}%
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-[16px] font-bold leading-snug text-foreground">
              <Link href={offer.ctaHref ?? '#'} className="transition-colors hover:text-orange-600">
                {offer.title}
              </Link>
            </h3>

            {offer.description && (
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                {offer.description}
              </p>
            )}

            {offer.endsText && (
              <div
                className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isSeatsLimited
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                }`}
              >
                <Clock className="h-3 w-3" strokeWidth={2.2} />
                {offer.endsText}
              </div>
            )}

            {/* Price */}
            <div className="mt-4 flex items-end justify-between border-t border-orange-100 pt-3 dark:border-orange-900/30">
              {offer.oldPrice ? (
                <span className="text-[11px] text-muted-foreground line-through">{formatINR(offer.oldPrice)}</span>
              ) : (
                <span className="text-[11px]">&nbsp;</span>
              )}
              <p className="text-[22px] font-extrabold leading-tight text-orange-600 dark:text-orange-400">
                {offer.price > 0 ? formatINR(offer.price) : 'Custom'}
              </p>
              <p className="text-[9px] text-muted-foreground">per person</p>
            </div>

            <p className="mt-2 border-t border-orange-100 pt-2 text-[10px] italic text-muted-foreground dark:border-orange-900/30">
              <Tag className="-mt-0.5 mr-1 inline h-3 w-3" />
              Fully customisable — dates, hotels & group size
            </p>

            {/* CTAs */}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-orange-100 pt-3 dark:border-orange-900/30">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 py-2.5 text-[12px] font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  WhatsApp
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={offer.ctaHref ?? '#'}
                  className="flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 py-2.5 text-[12px] font-extrabold text-white transition-all hover:brightness-110 hover:shadow-gold"
                >
                  Explore Adventure →
                </Link>
              </motion.div>
            </div>
          </div>
        </article>
      </Tilt3D>
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

export function AdventureSection({ heading, offers }: AdventureSectionProps) {
  if (offers.length === 0) return null;

  return (
    <section id="adventures" className="relative isolate z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24">
      <div aria-hidden className="orb orb-gold absolute -left-16 top-10 -z-10 h-72 w-72" />
      <div aria-hidden className="orb orb-green absolute -right-10 bottom-0 -z-10 h-80 w-80" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.p
            className="rv text-[11px] font-bold tracking-[0.22em] text-gold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {heading.kicker}
          </motion.p>
          <motion.h2
            className="rv h-display mt-3 text-[17px] font-bold text-foreground"
            style={{ '--rd': '0.08s' } as React.CSSProperties}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {renderAccents(heading.title)}
          </motion.h2>
        </div>
        {heading.subtitle && (
          <motion.p
            className="rv text-sm text-muted-foreground"
            style={{ '--rd': '0.16s' } as React.CSSProperties}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {heading.subtitle}
          </motion.p>
        )}
      </div>

      <motion.div
        className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {offers.map((o, i) => (
          <AdventureCard key={o.id} offer={o} index={i} />
        ))}
      </motion.div>
    </section>
  );
}
