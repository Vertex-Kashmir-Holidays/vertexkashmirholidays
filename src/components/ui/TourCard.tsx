'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Tilt3D } from './3DTilt';
import { useSiteSettings, useWhatsAppLink } from '@/components/providers/SiteSettingsProvider';

interface TourCardProps {
  tour: {
    badge: string;
    bc: 'orange' | 'blue' | 'green';
    seed?: string;
    image?: string;
    detailHref?: string;
    bookHref?: string;
    whatsappHref?: string;
    t: string;
    d: string;
    places: string;
    r: string;
    n: string;
    old?: string;
    p: string;
    inclusions?: {
      transfers?: boolean;
      hotel?: string;
      meals?: boolean;
      shikara?: boolean;
    };
  };
  index?: number;
  variant?: 'home' | 'tours';
}

const badgeCls = {
  orange: 'bg-badge-orange',
  blue: 'bg-badge-blue',
  green: 'bg-badge-green',
};

export function TourCard({ tour, index = 0, variant = 'tours' }: TourCardProps) {
  const isHome = variant === 'home';

  // Default inclusions if not provided
  const inclusions = tour.inclusions || {
    transfers: true,
    hotel: '3★',
    meals: true,
    shikara: true,
  };

  // Clicking the card (image, title or primary CTA) opens the tour detail page.
  const detailHref = tour.detailHref || tour.bookHref || '#';

  // WhatsApp CTA → site number with a package-specific prefilled message.
  // A real provided href wins; placeholder "#" / empty falls back to the site number.
  const { siteName } = useSiteSettings();
  const wa = useWhatsAppLink();
  const explicitWa = tour.whatsappHref && tour.whatsappHref !== '#' ? tour.whatsappHref : null;
  const whatsappHref =
    explicitWa ||
    wa(`Hi ${siteName}! I'm interested in the "${tour.t}" Kashmir package. Could you share details and availability?`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Tilt3D intensity={isHome ? 8 : 6}>
        <article
          className={`group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
            isHome
              ? 'bg-gradient-to-br from-foreground/[0.05] to-transparent backdrop-blur-sm border border-border rounded-3xl shadow-card hover:shadow-green-glow/20'
              : 'border border-border bg-card shadow-soft hover:shadow-primary/10'
          }`}
        >
          {/* Image Section */}
          <div className="relative h-44 overflow-hidden">
            <Link href={detailHref} aria-label={tour.t} className="relative block h-full w-full">
              <Image
                src={tour.image || '/hero/hero.webp'}
                alt={tour.t}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </Link>
            <motion.span
              className={`absolute left-3 top-3 rounded-md ${badgeCls[tour.bc]} px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white shadow-lg`}
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: index * 0.05 + 0.3 }}
            >
              {tour.badge}
            </motion.span>
            <motion.button
              aria-label="Save to wishlist"
              className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition-all duration-300 hover:scale-110 ${
                isHome
                  ? 'glass text-foreground hover:bg-foreground/20'
                  : 'bg-white/25 text-white hover:bg-white hover:text-rose-500'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
              </svg>
            </motion.button>
          </div>

          {/* Content Section */}
          <div className="flex flex-1 flex-col p-5">
            {/* Title */}
            <h3 className={`text-[16px] font-bold leading-snug ${isHome ? 'text-foreground' : 'text-foreground'}`}>
              <Link href={detailHref} className="transition-colors hover:text-primary">
                {tour.t}
              </Link>
            </h3>
            
            {/* Duration & Destinations */}
            <p className={`mt-1.5 text-[12px] leading-relaxed ${isHome ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
              <span className="font-semibold">{tour.d}</span>
              <span className="mx-2 opacity-40">·</span>
              {tour.places}
            </p>

            {/* Inclusions Grid */}
            <div className={`mt-3 grid grid-cols-4 gap-2 py-2 border-t border-b ${isHome ? 'border-border' : 'border-border'}`}>
              {/* Transfers */}
              <div className="flex flex-col items-center gap-1">
                <svg className={`h-5 w-5 ${isHome ? 'text-primary' : 'text-primary'}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M7 16a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-6 0" />
                  <path d="M10 6v6" />
                  <path d="M14 6v6" />
                </svg>
                <span className={`text-[9px] font-medium ${isHome ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Transfers</span>
              </div>

              {/* Hotel */}
              <div className="flex flex-col items-center gap-1">
                <svg className={`h-5 w-5 ${isHome ? 'text-primary' : 'text-primary'}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" />
                </svg>
                <span className={`text-[9px] font-medium ${isHome ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{inclusions.hotel || '3★'}</span>
              </div>

              {/* Meals */}
              <div className="flex flex-col items-center gap-1">
                <svg className={`h-5 w-5 ${isHome ? 'text-primary' : 'text-primary'}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                  <path d="M7 9h10" />
                  <path d="M7 13h10" />
                  <path d="M7 17h10" />
                </svg>
                <span className={`text-[9px] font-medium ${isHome ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Meals</span>
              </div>

              {/* Shikara */}
              <div className="flex flex-col items-center gap-1">
                <svg className={`h-5 w-5 ${isHome ? 'text-primary' : 'text-primary'}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M4 12h16" />
                  <path d="M8 12v8" />
                  <path d="M16 12v8" />
                  <path d="M12 12v8" />
                  <path d="M2 20h20" />
                </svg>
                <span className={`text-[9px] font-medium ${isHome ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Shikara</span>
              </div>
            </div>

            {/* Price Section */}
            <div className="mt-3 flex items-end justify-between">
                {tour.old ? (
                  <span className={`text-[11px] ${isHome ? 'text-muted-foreground' : 'text-muted-foreground'} line-through`}>{tour.old}</span>
                ) : (
                  <span className="text-[11px]">&nbsp;</span>
                )}
                <p className={`text-[22px] font-extrabold leading-tight ${isHome ? 'text-primary' : 'text-foreground'}`}>
                  {tour.p}
                </p>
                <p className={`text-[9px] ${isHome ? 'text-muted-foreground' : 'text-muted-foreground'}`}>per person</p>
            </div>

            {/* Customization Text */}
            <p className={`mt-3 py-1 text-[10px] italic  border-t  ${isHome ? 'text-muted-foreground border-border' : 'text-muted-foreground border-border'}`}>
              ✦ Tour can be customized as per requirements
            </p>

            {/* CTA Buttons */}
            <div className={`mt-3 py-2 grid grid-cols-2 gap-2 border-t ${isHome ? 'border-border' : 'border-border'}`}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[12px] font-semibold transition-all duration-300 ${
                    isHome
                      ? 'border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow'
                      : 'border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z" />
                  </svg>
                  WhatsApp
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={detailHref}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[12px] font-semibold transition-all duration-300 ${
                    isHome
                      ? 'bg-primary text-primary-foreground hover:brightness-110 hover:shadow-glow'
                      : 'bg-primary text-primary-foreground hover:brightness-110 hover:shadow-md'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                  </svg>
                  Book Now
                </Link>
              </motion.div>
            </div>
          </div>
        </article>
      </Tilt3D>
    </motion.div>
  );
}