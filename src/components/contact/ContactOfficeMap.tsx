// src/components/contact/ContactOfficeMap.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react';
import type { ContactOfficeContent, ContactOfficeData } from '@/types/contact';

interface ContactOfficeMapProps {
  content: ContactOfficeContent;
  // Accepted for backwards compatibility with the parent's fetch, but the
  // "Other Offices" card is currently hidden (single-office business) —
  // intentionally unused below rather than removing the data plumbing.
  offices: ContactOfficeData[];
}

// Client-safe, HTTP-referrer-restricted key for the Maps Embed API — distinct
// from the server-only GOOGLE_PLACES_API_KEY, which must never reach the
// client (it has no referrer restriction and is used for billed API calls).
const mapEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

export function ContactOfficeMap({ content }: ContactOfficeMapProps) {
  return (
    <section className="mt-14 grid items-start gap-7 lg:grid-cols-[40%_60%]">
      {/* Office info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">{content.kicker}</p>
        <h2 className="h-display mt-2 font-display text-[26px] font-bold">{content.title}</h2>
        {content.subtitle && <p className="mt-2 text-[12.5px] text-muted-foreground">{content.subtitle}</p>}

        <ul className="mt-6 space-y-4 text-[12.5px]">
          <li className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
            <span>
              {content.name && <strong className="text-[13px]">{content.name}</strong>}
              {content.name && <br />}
              {content.address && <span className="text-muted-foreground">{content.address}</span>}
            </span>
          </li>
          {content.phone && (
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              <a href={`tel:${content.phone.replace(/\s/g, '')}`} className="hover:text-primary">{content.phone}</a>
            </li>
          )}
          {content.email && (
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              <a href={`mailto:${content.email}`} className="font-semibold text-primary hover:underline">{content.email}</a>
            </li>
          )}
          {content.hours && (
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              <span className="whitespace-pre-line">{content.hours}</span>
            </li>
          )}
        </ul>

        {(content.legalName || content.tourismRegNumber) && (
          <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
            {content.legalName && content.legalName !== content.brandName
              ? `"${content.brandName ?? 'Vertex Kashmir Holidays'}" is operated by ${content.legalName}`
              : content.brandName ?? 'Vertex Kashmir Holidays'}
            {content.tourismRegNumber && <br />}
            {content.tourismRegNumber && `J&K Tourism Reg. No. ${content.tourismRegNumber}`}
          </p>
        )}

        <Link
          href={content.directionsUrl ?? '#'}
          target='_blank'
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[12.5px] font-bold text-primary-foreground shadow-card transition hover:brightness-110"
        >
          Get Directions on Google Maps
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </Link>
      </motion.div>

      {/* Map — real Google Maps embed when a Place ID + embed key are
          configured; falls back to the decorative illustration below
          otherwise (never breaks the page, matches how the rest of the
          Google integrations on this site degrade gracefully). */}
      <motion.div
        className="relative h-[330px] overflow-hidden rounded-2xl border border-border shadow-soft lg:h-[360px]"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {mapEmbedKey && content.placeId ? (
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=${mapEmbedKey}&q=place_id:${content.placeId}`}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map showing the location of ${content.brandName ?? 'Vertex Kashmir Holidays'}`}
            aria-label={`Map showing the location of ${content.brandName ?? 'Vertex Kashmir Holidays'}`}
          />
        ) : (
        <svg viewBox="0 0 700 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map showing the Vertex Kashmir Holidays head office">
          <rect width="700" height="400" fill="hsl(40 25% 95%)" />
          <ellipse cx="640" cy="120" rx="90" ry="70" fill="hsl(120 25% 86%)" />
          <ellipse cx="80" cy="330" rx="100" ry="60" fill="hsl(120 25% 88%)" />
          <ellipse cx="540" cy="350" rx="80" ry="45" fill="hsl(120 25% 88%)" />
          <path d="M250 90 C330 70 420 95 440 150 C460 205 430 250 380 265 C320 282 260 270 230 230 C205 196 200 130 250 90 Z" fill="hsl(200 65% 80%)" />
          <path d="M300 130 C330 122 360 135 365 158 C370 180 355 198 330 202 C305 206 285 196 280 175 C276 158 282 138 300 130 Z" fill="hsl(200 60% 86%)" />
          <g stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round">
            <path d="M0 210 C120 195 180 230 230 232 C300 235 340 290 420 295 C520 300 600 270 700 280" />
            <path d="M90 0 C100 90 140 160 150 250 C158 320 150 360 140 400" />
            <path d="M460 0 C455 70 470 130 520 180 C570 230 600 300 610 400" />
            <path d="M230 232 C260 300 300 340 360 400" />
            <path d="M150 120 C220 110 250 100 250 90" />
          </g>
          <g stroke="hsl(40 15% 85%)" strokeWidth="3" fill="none">
            <path d="M0 110 H140" />
            <path d="M160 320 H360" />
            <path d="M480 70 H700" />
            <path d="M540 200 C580 210 620 215 700 210" />
          </g>
          <g fontFamily="Inter, sans-serif" fill="hsl(206 12% 45%)" fontWeight="600">
            <text x="330" y="185" fontSize="15" letterSpacing="2" fill="hsl(205 45% 45%)">DAL LAKE</text>
            <text x="560" y="65" fontSize="11" letterSpacing="1.5">NISHAT BAGH</text>
            <text x="470" y="160" fontSize="11" letterSpacing="1.5">HAZRATBAL</text>
            <text x="430" y="335" fontSize="11" letterSpacing="1.5">LAL CHOWK</text>
            <text x="610" y="320" fontSize="11" letterSpacing="1.5">BUNIAT</text>
            <text x="60" y="170" fontSize="11" letterSpacing="1.5">DARGAH</text>
            <text x="230" y="385" fontSize="11" letterSpacing="1.5">RAJBAGH</text>
            <text x="380" y="378" fontSize="11" letterSpacing="1.5">RABAGH</text>
          </g>
          <g transform="translate(318 218)">
            <circle cx="0" cy="34" r="5" fill="rgba(0,0,0,.15)" />
            <path d="M0 -14 C-11 -14 -18 -6 -18 4 C-18 16 0 34 0 34 C0 34 18 16 18 4 C18 -6 11 -14 0 -14 Z" fill="hsl(355 80% 55%)" />
            <circle cx="0" cy="3" r="6" fill="#fff" />
          </g>
        </svg>
        )}
        {/* This callout is positioned to match the illustration's fixed pin
            coordinates — only meaningful over the SVG fallback, not the real
            embed (Google places its own marker). */}
        {!mapEmbedKey || !content.placeId ? content.mapLabel && (
          <div className="absolute left-[26%] top-[18%] rounded-xl bg-card px-4 py-3 shadow-card">
            <p className="text-[12.5px] font-bold">{content.mapLabel}</p>
            {content.mapSubLabel && <p className="text-[11px] text-muted-foreground">{content.mapSubLabel}</p>}
            <span className="absolute -bottom-1.5 left-8 h-3 w-3 rotate-45 bg-card" />
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}
