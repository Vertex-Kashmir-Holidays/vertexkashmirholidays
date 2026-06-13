'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative z-[2] mt-28">
      <div className="mx-auto max-w-[1300px] px-6">
        <div className="sweep glass-strong relative overflow-hidden rounded-[2rem] p-10 text-center shadow-glass">
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl"></div>
          <h2 className="rv h-display text-4xl font-bold text-foreground">
            Ready to step <span className="grad-text-cool italic">through the portal?</span>
          </h2>
          <p className="rv mt-3 text-sm text-muted-foreground" style={{ '--rd': '0.08s' } as React.CSSProperties}>
            Tell us your dates — get a handcrafted itinerary on WhatsApp within the hour.
          </p>
          <div className="rv mt-7 flex flex-wrap justify-center gap-3" style={{ '--rd': '0.16s' } as React.CSSProperties}>
            <Link
              href="#"
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-glow ring-inner transition hover:scale-[1.03]"
            >
              Plan My Trip Free →
            </Link>
            <Link
              href="#packages"
              className="glass rounded-full px-8 py-3.5 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
            >
              Browse Packages
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 border-t border-border bg-card/60 backdrop-blur">
        <div className="mx-auto grid max-w-[1300px] gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground ring-inner">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="leading-none">
                <span className="block font-display text-lg font-extrabold text-foreground">Vertex Kashmir</span>
                <span className="block text-[9px] font-bold tracking-[0.4em] text-primary">HOLIDAYS</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Locally based in Srinagar. Handcrafted Kashmir holidays with zero middlemen, transparent pricing and 24/7
              on-ground support.
            </p>
            <div className="mt-5 flex gap-2.5">
              <Link href="#" aria-label="Instagram" className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10">
                ◎
              </Link>
              <Link href="#" aria-label="Facebook" className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10">
                f
              </Link>
              <Link href="#" aria-label="YouTube" className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10">
                ▶
              </Link>
              <Link href="#" aria-label="WhatsApp" className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10">
                ✆
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Explore</p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
              <li>
                <Link href="/packages" className="transition hover:text-primary">Tour Packages</Link>
              </li>
              <li>
                <Link href="/destinations" className="transition hover:text-primary">Destinations</Link>
              </li>
              <li>
                <Link href="/offers" className="transition hover:text-primary">Special Offers</Link>
              </li>
              <li>
                <Link href="/blog" className="transition hover:text-primary">Travel Blog</Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-primary">About Us</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Support</p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
              <li>
                <Link href="/contact" className="transition hover:text-primary">Contact Us</Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-primary">FAQs</Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-primary">Cancellation Policy</Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-primary">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-primary">Privacy Policy</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Get valley updates</p>
            <p className="mt-3 text-[13px] text-muted-foreground">Snow alerts, new treks &amp; flash deals. One email a month.</p>
            <div className="mt-4 flex overflow-hidden rounded-full border border-border bg-foreground/[.04] p-1">
              <input
                className="w-full bg-transparent px-4 text-sm text-foreground placeholder-foreground/40 outline-none"
                placeholder="Email address"
              />
              <button className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground ring-inner">
                Subscribe
              </button>
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
              📍 Boulevard Road, Dal Gate, Srinagar 190001<br />
              ✆ +91 99999 00000 · hello@vertexkashmir.com
            </p>
          </div>
        </div>
        <div className="border-t border-border py-5">
          <p className="mx-auto max-w-[1300px] px-6 text-center text-[12px] text-muted-foreground">
            © 2026 Vertex Kashmir Holidays · J&amp;K Tourism Licensed · Razorpay Secured Payments
          </p>
        </div>
      </div>
    </footer>
  );
}
