'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import { Tilt3D } from '@/components/ui/3DTilt';
import { Clock } from 'lucide-react';
import { formatINR, renderAccents } from '@/lib/accents';
import { imgSrc } from '@/lib/placeholder';
import type { OfferData, SectionHeading } from '@/types/home';

interface OffersSectionProps {
  heading: SectionHeading;
  offers: OfferData[];
}

export function OffersSection({ heading, offers }: OffersSectionProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  if (offers.length === 0) return null;

  return (
    <section id="offers" className="relative isolate z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24">
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
            className="rv h-display mt-3 text-3xl sm:text-4xl font-bold text-foreground"
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
          <motion.div key={o.id} variants={itemVariants}>
            <Tilt3D intensity={6}>
              <article
                className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-orange-brand/10 to-card shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-orange-brand/20"
              >
                <div className="shine absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={imgSrc(o.image)}
                    alt={o.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {o.badge && (
                    <motion.span
                      className="grad-orange pop-sm absolute left-3 top-3 rounded-lg px-3 py-1 text-[10px] font-extrabold text-navy-brand shadow-lg"
                      initial={{ x: -20 }}
                      animate={{ x: 0 }}
                      transition={{ delay: i * 0.05 + 0.3 }}
                    >
                      {o.badge}
                    </motion.span>
                  )}
                </div>

                <div className="pop-sm relative p-6">
                  <h3 className="h-display text-xl font-bold text-foreground">{o.title}</h3>
                  {o.description && (
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{o.description}</p>
                  )}

                  <div className="mt-5 flex items-end justify-between">
                    <p>
                      {o.oldPrice && (
                        <>
                          <span className="text-[11px] text-muted-foreground line-through">{formatINR(o.oldPrice)}</span>
                          <br />
                        </>
                      )}
                      <span className="text-2xl font-extrabold text-brand-green">{formatINR(o.price)}</span>
                      <span className="text-[10px] text-muted-foreground"> /person</span>
                    </p>
                    {o.endsText && (
                      <span className="glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold text-brand-green">
                        <Clock className="h-3 w-3" strokeWidth={2} /> {o.endsText}
                      </span>
                    )}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      href={o.ctaHref ?? '#'}
                      className="grad-orange mt-5 block rounded-xl py-3 text-center text-xs font-extrabold text-navy-brand ring-inner transition-all duration-300 hover:brightness-110 hover:shadow-gold"
                    >
                      Grab This Deal →
                    </Link>
                  </motion.div>
                </div>
              </article>
            </Tilt3D>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
