"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plane, X } from "lucide-react";

export interface StripBannerData {
  id: string;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}

// Brand gold used for the offer highlight + CTA pill against the dark-emerald bar.
const GOLD = "#E3C67D";
const STRIP_GRADIENT = "linear-gradient(90deg, #0F3D2E 0%, #145A45 100%)";
const EASE = [0.22, 1, 0.36, 1] as const;

// Matches promo-style tokens ("20% Off", "₹5,000", "$99 off", "Flat", "Free")
// so only those are gold-highlighted — the rest of the sentence stays white.
// Exactly one capturing group, so String.split() yields matches at odd indices.
const OFFER_RE =
  /((?:\d+(?:\.\d+)?%)(?:\s*off)?|(?:₹|rs\.?\s?|\$)\s?\d[\d,]*(?:\s*off)?|\bflat\b|\bfree\b)/gi;

/** Renders text with any offer tokens wrapped in a gold span. */
function Highlighted({ text }: { text: string }) {
  const parts = text.split(OFFER_RE);
  return (
    <>
      {parts.map((part, i) =>
        !part ? null : i % 2 === 1 ? (
          <span key={i} className="font-semibold" style={{ color: GOLD }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * Presentational strip surface — the exact bar shown on the public site, with no
 * sticky/animation/dismissal logic. Reused by the live BannerStrip below and by
 * the admin live preview so the two can never drift. When `onClose` is omitted
 * (preview) the close button is decorative and removed from the tab order.
 */
export function BannerStripView({
  banner,
  onClose,
  forceMobile = false,
}: {
  banner: StripBannerData;
  onClose?: () => void;
  // Forces the compact single-line mobile treatment regardless of viewport —
  // used by the admin preview's "Mobile" mode. Public usage leaves it responsive.
  forceMobile?: boolean;
}) {
  const hasCta = Boolean(banner.ctaLabel && banner.ctaUrl);
  const interactive = typeof onClose === "function";
  // On mobile the icon + body are hidden so the line never wraps or overflows.
  const iconCls = forceMobile ? "hidden" : "hidden sm:block";
  const bodyCls = forceMobile ? "hidden" : "hidden sm:inline";
  const textCls = forceMobile ? "text-[11px]" : "text-[11px] sm:text-[12.5px]";
  const ctaText = forceMobile ? "text-[10px]" : "text-[10px] sm:text-[10.5px]";

  return (
    <div className="border-b border-white/10" style={{ background: STRIP_GRADIENT }}>
      {/* Same max-width + padding as the navbar pill so content lines up. */}
      <div className="relative mx-auto flex h-8 max-w-[1300px] items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Message — travel icon, white text, gold only on the offer token.
            px clears the close button so the centered line never collides. */}
        <p
          className={`flex min-w-0 items-center justify-center gap-x-2 truncate whitespace-nowrap px-6 text-center font-medium leading-none tracking-[0.01em] text-white/90 ${textCls}`}
        >
          <Plane
            aria-hidden="true"
            className={`h-3 w-3 shrink-0 -rotate-12 ${iconCls}`}
            style={{ color: GOLD }}
            strokeWidth={2}
          />
          <span className="truncate">
            <Highlighted text={banner.title} />
          </span>
          {banner.body && (
            <span className={`truncate ${bodyCls}`}>
              <Highlighted text={banner.body} />
            </span>
          )}
          {hasCta &&
            (interactive ? (
              <Link
                href={banner.ctaUrl!}
                className={`ring-inner ml-1 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider text-[#0F3D2E] shadow-sm transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${ctaText}`}
                style={{ backgroundColor: GOLD }}
              >
                {banner.ctaLabel}
              </Link>
            ) : (
              // Preview: non-navigating, styled identically.
              <span
                className={`ring-inner ml-1 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider text-[#0F3D2E] shadow-sm ${ctaText}`}
                style={{ backgroundColor: GOLD }}
              >
                {banner.ctaLabel}
              </span>
            ))}
        </p>

        {/* Close — large tap target (h-8 w-8), visually subtle icon. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss announcement"
          aria-hidden={interactive ? undefined : true}
          tabIndex={interactive ? 0 : -1}
          className={`absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/45 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${
            interactive ? "" : "pointer-events-none"
          }`}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/**
 * Thin full-width promotional bar shown above the navbar. One is rendered at a
 * time (the highest-priority active STRIP banner). Dismissable per browser
 * session via sessionStorage key `vkh_strip_{id}` — it stays hidden until the
 * tab is closed or a different banner (new id) goes live. It slides/fades in and
 * out, and the fixed navbar offsets itself beneath it (see Navbar).
 */
export function BannerStrip({ banner }: { banner: StripBannerData }) {
  const storageKey = `vkh_strip_${banner.id}`;
  // Start hidden to avoid a flash before the dismissal check runs on mount.
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  // Tell the (fixed) navbar whether a strip occupies the top of the viewport so
  // it can offset itself below — or reset to the top once the strip is dismissed.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("vk-strip", { detail: { visible } }));
  }, [visible]);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* sessionStorage unavailable — dismissal simply won't persist */
    }
  }

  const duration = reduceMotion ? 0 : 0.34;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          id="vk-strip"
          // Sticky so it stays pinned at the very top while the fixed navbar sits
          // directly beneath it — no scroll gap opens up. Height animates so the
          // page below eases open/closed rather than jumping.
          className="sticky top-0 z-50 overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration, ease: EASE }}
        >
          <BannerStripView banner={banner} onClose={dismiss} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
