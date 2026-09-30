"use client";

import { motion } from "framer-motion";
import { EASE_BRAND } from "@/lib/motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ReactNode } from "react";

// ──────────────────────────────────────────────────────────────────────────
// Shared wrapper for every non-home page hero (About, Blog, Contact, Tours,
// Destinations, Legal, …). It owns three things so each page never has to
// re-derive them:
//   1. Equal height       — a fixed `min-h-[360px]` band on every page.
//   2. Nav clearance       — top padding clears the fixed Navbar; content is
//                            vertically centred in the remaining space.
//   3. Background + overlay — responsive <picture> (mobile/desktop) and the
//                            brand gradient scrim.
// Pages pass their own breadcrumb/title/content as children.
// ──────────────────────────────────────────────────────────────────────────

interface SecondaryHeroProps {
  /** Desktop background image URL. */
  image?: string | null;
  /** Optional ≤640px background image URL. */
  imageMobile?: string | null;
  alt?: string;
  children: ReactNode;
  /** Optional right-side content (e.g. a lead-capture card). When present the
   *  hero switches to a two-column layout; content stays left, aside goes right. */
  aside?: ReactNode;
  /** Half the standard band height, for lighter-weight pages (e.g. Careers)
   *  that don't need a full-height hero. Top padding (nav clearance) stays
   *  the same either way — only the height band and bottom padding shrink. */
  compact?: boolean;
  /**
   * Desktop-only (lg+) content/aside column split, as CSS grid track values —
   * e.g. `contentWidth="0.9fr"` `asideWidth="minmax(0,520px)"` to give a wider
   * form more room. Both default to the original 1.1fr / 420px split every
   * other hero page already uses, so omitting these changes nothing. Applied
   * via CSS custom properties (not a raw arbitrary Tailwind class) so the
   * lg:grid-cols-[...] class stays a fixed string Tailwind's JIT can compile,
   * regardless of the actual value passed per page. Mobile/tablet always
   * stack single-column, unaffected either way.
   */
  contentWidth?: string;
  asideWidth?: string;
  /** Max-width Tailwind class for the aside column itself — bump alongside a
   *  wider `asideWidth` if you want the aside content wider than the default
   *  max-w-md (448px) cap. */
  asideMaxWidthClass?: string;
}

export function SecondaryHero({
  image,
  imageMobile,
  alt = "",
  children,
  aside,
  compact = false,
  contentWidth = "1.1fr",
  asideWidth = "minmax(0,420px)",
  asideMaxWidthClass = "max-w-md",
}: SecondaryHeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      {image && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: EASE_BRAND }}
        >
          {imageMobile ? (
            <>
              <Image
                src={imageMobile}
                alt={alt}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center sm:hidden"
              />
              <Image
                src={image}
                alt={alt}
                fill
                priority
                sizes="100vw"
                className="hidden object-cover object-center sm:block"
              />
            </>
          ) : (
            <Image
              src={image}
              alt={alt}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          )}
        </motion.div>
      )}
      {/* Scrim: vertical on mobile (content + card stack, so darken top→bottom for
          readability), horizontal from lg up (two columns, so darken left→right
          and let the photo breathe behind the card). */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/85 via-brand-dark/55 to-brand-dark/80 lg:bg-gradient-to-r lg:from-brand-dark/85 lg:via-brand-dark/45 lg:to-transparent" />

      {/* Responsive min-height keeps a consistent band without crushing content on
          small phones; the flex column vertically centres within the nav-cleared
          area. */}
      <div
        className={
          compact
            ? "relative mx-auto flex min-h-[190px] w-full max-w-[1300px] flex-col justify-center px-5 pb-6 pt-28 sm:px-6 sm:pb-8 sm:pt-32 lg:min-h-[230px]"
            : "relative mx-auto flex min-h-[380px] w-full max-w-[1300px] flex-col justify-center px-5 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:min-h-[460px]"
        }
      >
        {aside ? (
          <div
            className="grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-[var(--sh-content)_var(--sh-aside)]"
            style={
              { "--sh-content": contentWidth, "--sh-aside": asideWidth } as React.CSSProperties
            }
          >
            <div className="min-w-0">{children}</div>
            <div
              className={cn(
                "min-w-0 w-full justify-self-center lg:justify-self-end",
                asideMaxWidthClass,
              )}
            >
              {aside}
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
