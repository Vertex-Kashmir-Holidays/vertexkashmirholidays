// src/components/sections/ContactOfficeMap.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function ContactOfficeMap() {
  const offices = [
    ['Gulmarg Outpost (Seasonal)', 'Near Gondola Phase I, Gulmarg, Jammu & Kashmir – 193403', 'Dec – Mar & Apr – Jun'],
    ['Delhi Liaison Office', 'Karol Bagh, New Delhi – 110005', 'Mon – Sat: 10 AM – 6 PM'],
    ['Mumbai Liaison', 'Andheri West, Mumbai – 400053', 'Mon – Sat: 10 AM – 6 PM'],
  ];

  return (
    <section className="mt-14 grid items-start gap-7 lg:grid-cols-[250px_1fr_240px]">
      {/* Office info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-[11.5px] font-bold tracking-[0.22em] text-brand-green2">VISIT OUR OFFICE</p>
        <h2 className="h-display mt-2 font-display text-[26px] font-bold">Come Say Hello 👋</h2>
        <p className="mt-2 text-[12.5px] text-brand-mute">We'd love to meet you in our hometown.</p>

        <ul className="mt-6 space-y-4 text-[12.5px]">
          <li className="flex items-start gap-2.5">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-green2" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>
              <strong className="text-[13px]">Head Office – Srinagar</strong>
              <br />
              <span className="text-brand-mute">Boulevard Road, Near Dal Lake, Srinagar – 190001, Jammu &amp; Kashmir, India</span>
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand-green2" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
            </svg>
            +91 99 9999 9999
          </li>
          <li className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand-green2" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>
            <a href="mailto:hello@vertexkashmir.com" className="font-semibold text-brand-green2 hover:underline">hello@vertexkashmir.com</a>
          </li>
          <li className="flex items-start gap-2.5">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-green2" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span>
              Mon – Sat: <strong>10:00 AM – 6:00 PM IST</strong>
              <br />
              Sunday: <strong>10:00 AM – 2:00 PM IST</strong>
            </span>
          </li>
        </ul>

        <Link
          href="#"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-3 text-[12.5px] font-bold text-white shadow-card transition hover:brightness-110"
        >
          Get Directions on Google Maps
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </motion.div>

      {/* Map */}
      <motion.div
        className="relative h-[330px] overflow-hidden rounded-2xl border border-brand-line shadow-soft lg:h-[360px]"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <svg viewBox="0 0 700 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of Srinagar showing the Vertex Kashmir Holidays office near Dal Lake">
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
        <div className="absolute left-[26%] top-[18%] rounded-xl bg-white px-4 py-3 shadow-card">
          <p className="text-[12.5px] font-bold">Vertex Kashmir Holidays</p>
          <p className="text-[11px] text-brand-mute">Boulevard Road, Srinagar</p>
          <span className="absolute -bottom-1.5 left-8 h-3 w-3 rotate-45 bg-white" />
        </div>
      </motion.div>

      {/* Other offices */}
      <motion.div
        className="rounded-2xl border border-brand-line bg-brand-page p-5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <p className="text-[11.5px] font-bold tracking-[0.18em] text-brand-ink/80">OTHER OFFICES</p>
        <ul className="mt-4 space-y-5 text-[12px]">
          {offices.map((office, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-green2" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div className="leading-snug">
                <p className="text-[12.5px] font-bold">{office[0]}</p>
                <p className="mt-0.5 text-brand-mute">{office[1]}</p>
                <p className="mt-0.5 text-brand-mute">{office[2]}</p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}