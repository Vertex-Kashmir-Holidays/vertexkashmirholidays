"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { HeroStats } from "@/components/layout/HeroStats";
import { WhatsAppIcon } from "@/components/icons/brand";
import { useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { trackWhatsappClick } from "@/lib/analytics";
import { formatINR } from "@/lib/accents";
import type { SiteStatData } from "@/types/home";
import { occasionIcon } from "@/components/icons/occasion";
import {
  offerClickParams,
  offerWhatsAppMessage,
  scrollToSection,
  useOfferSelection,
} from "./OfferSelection";

export interface OfferHeroPlan {
  name: string;
  priceForTwo: number;
  splitLabel: string;
}

interface OfferHeroProps {
  title: string;
  subtitle: string | null;
  occasionLabel: string;
  occasionType: string;
  duration: string | null;
  routeLabel: string | null;
  heroImage: string | null;
  heroImageMobile: string | null;
  plans: OfferHeroPlan[];
  stats?: SiteStatData[];
  // The trip's dates have passed — the CTAs give way to a "this offer ran"
  // notice pointing at current offers and tours.
  ended?: boolean;
}

// Festive particles per occasion, using the same global .ember/.flake CSS the
// Adventures hero uses. Occasions without a natural motif get none.
const PARTICLES: Record<string, "ember" | "flake" | undefined> = {
  DIWALI: "ember",
  CHRISTMAS: "flake",
  NEW_YEAR: "flake",
};

function Particles({ kind }: { kind: "ember" | "flake" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 28; i++) {
      const p = document.createElement("i");
      p.className = kind;
      const z = Math.random();
      p.style.cssText =
        kind === "ember"
          ? `left:${Math.random() * 100}%;bottom:${Math.random() * 30}%;width:${2 + Math.random() * 3}px;height:${2 + Math.random() * 3}px;animation-duration:${5 + Math.random() * 7}s;animation-delay:-${Math.random() * 7}s`
          : `left:${Math.random() * 100}%;top:${-Math.random() * 20}%;width:${2 + z * 3.5}px;height:${2 + z * 3.5}px;opacity:${0.3 + z * 0.55};animation-duration:${8 + Math.random() * 11}s;animation-delay:-${Math.random() * 12}s`;
      el.appendChild(p);
    }
    return () => {
      el.innerHTML = "";
    };
  }, [kind]);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" />
  );
}

const reveal = (delay: string) =>
  ({ "--hr-y": "20px", "--hr-delay": delay }) as React.CSSProperties;

// Full-bleed campaign hero: festive particles over the offer's photo; left —
// occasion, H1, the fixed trip facts, "from" price and the two CTAs; right
// (lg+) — every plan with its price for 2 and night split, so the offer is
// understood before scrolling. Live site stats close the hero.
export function OfferHero({
  title,
  subtitle,
  occasionLabel,
  occasionType,
  duration,
  routeLabel,
  heroImage,
  heroImageMobile,
  plans,
  stats,
  ended = false,
}: OfferHeroProps) {
  const { offer, selected, view, openEnquiry } = useOfferSelection();
  const wa = useWhatsAppLink();
  const fromPrice = plans.length ? Math.min(...plans.map((p) => p.priceForTwo)) : null;
  const particles = PARTICLES[occasionType];
  const OccasionIcon = occasionIcon(occasionType);
  const desktopImage = heroImage ?? "/hero/gulmarg-lg.webp";

  return (
    <section className="relative isolate overflow-hidden bg-brand-dark">
      <div className="absolute inset-0 -z-10">
        <Image
          src={heroImageMobile ?? desktopImage}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover sm:hidden"
        />
        <Image
          src={desktopImage}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="hidden object-cover sm:block"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/85 via-brand-dark/60 to-brand-dark lg:bg-gradient-to-r lg:from-brand-dark/90 lg:via-brand-dark/55 lg:to-brand-dark/20" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-dark to-transparent" />
        {particles && <Particles kind={particles} />}
      </div>

      <div className="mx-auto grid min-h-[min(88svh,860px)] max-w-[1300px] items-center gap-10 px-5 pb-12 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[1.2fr_400px] lg:pb-16">
        <div className="min-w-0">
          <nav
            className="flex flex-wrap items-center gap-2 text-[14px] text-white/75"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <span>›</span>
            <Link href="/offers" className="transition hover:text-white">
              Offers
            </Link>
            <span>›</span>
            <span className="font-semibold text-white">{offer.name}</span>
          </nav>

          <p
            className="hero-reveal mt-6 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/15 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-primary backdrop-blur"
            style={reveal("0.05s")}
          >
            <OccasionIcon className="h-4 w-4" /> {occasionLabel} Special · Fixed Departure
          </p>
          <h1
            className="hero-reveal h-display mt-4 text-[34px] font-bold leading-[1.08] text-white sm:text-5xl lg:text-[58px]"
            style={reveal("0.1s")}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="hero-reveal mt-4 max-w-xl text-[16px] leading-relaxed text-white/85 sm:text-[17px]"
              style={reveal("0.18s")}
            >
              {subtitle}
            </p>
          )}

          <ul
            className="hero-reveal mt-6 flex flex-wrap gap-2 text-[14px] font-semibold text-white"
            style={reveal("0.24s")}
          >
            {offer.dates && (
              <li className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5">
                <CalendarDays className="h-4 w-4 text-primary" /> {offer.dates}
              </li>
            )}
            {duration && (
              <li className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5">
                <Clock3 className="h-4 w-4 text-primary" /> {duration}
              </li>
            )}
            {routeLabel && (
              <li className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5">
                <MapPin className="h-4 w-4 text-primary" /> {routeLabel}
              </li>
            )}
            {!ended && (
              <li className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5">
                <Users className="h-4 w-4 text-primary" /> Prices for 2 adults
              </li>
            )}
          </ul>

          {ended ? (
            <div
              role="status"
              className="hero-reveal glass mt-7 max-w-xl rounded-2xl p-5 text-white"
              style={reveal("0.3s")}
            >
              <p className="text-[18px] font-bold">
                {offer.dates ? `This offer ran ${offer.dates}` : "This offer has ended"}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-white/75">
                Bookings for these dates are closed. The itinerary below shows what the trip
                included.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/offers"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[15px] font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110"
                >
                  See current offers
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </Link>
                <Link
                  href="/tours"
                  className="glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold text-white transition hover:bg-white/15"
                >
                  Browse tour packages
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="hero-reveal mt-7 flex flex-col gap-4 sm:flex-row sm:items-center"
              style={reveal("0.3s")}
            >
              {fromPrice !== null && (
                <p className="text-white sm:mr-3">
                  <span className="block text-[12px] uppercase tracking-[0.14em] text-white/65">
                    From · 2 adults
                  </span>
                  <span className="text-[32px] font-bold leading-none">{formatINR(fromPrice)}</span>
                </p>
              )}
              <button
                type="button"
                onClick={() => openEnquiry()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[15px] font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110"
              >
                {offer.ctaLabel}
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </button>
              <a
                href={wa(offerWhatsAppMessage(offer, selected))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackWhatsappClick(
                    "offer_hero",
                    undefined,
                    undefined,
                    offerClickParams(offer, selected),
                  )
                }
                className="glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-white/15"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                Ask on WhatsApp
              </a>
            </div>
          )}

          {stats && <HeroStats stats={stats} />}
        </div>

        {plans.length > 0 && (
          <div
            className="hero-reveal glass-cream hidden w-full rounded-3xl p-6 shadow-glass lg:block"
            style={reveal("0.4s")}
          >
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-primary">
              Choose your package · 2 adults
            </p>
            <ul className="mt-3 divide-y divide-border">
              {plans.map((p) => (
                <li key={p.name}>
                  <button
                    type="button"
                    onClick={() => {
                      view(p.name);
                      scrollToSection("plans");
                    }}
                    className="group flex w-full items-center justify-between gap-4 py-3.5 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-bold text-foreground">{p.name}</span>
                      {p.splitLabel && (
                        <span className="block text-[12px] leading-snug text-muted-foreground">
                          {p.splitLabel}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-[17px] font-bold text-foreground">
                      {formatINR(p.priceForTwo)}
                      <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-muted-foreground">
              Total price for 2 adults — same route, different stays.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
