"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_BRAND as EASE } from "@/lib/motion";

export interface PromoBannerData {
  id: string;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null; // desktop background
  imageMobileUrl: string | null; // ≤640px background (falls back to imageUrl)
}

/**
 * A single promotional banner — a floating, rounded glass card (matching the
 * footer "Ready to step through the portal?" CTA) with a background image
 * (separate mobile and desktop sources) clipped inside the rounded corners and
 * overlaid text + CTA. The exact markup is reused by the public PromoBanner and
 * the admin live preview so they can never drift.
 *
 * `preview` renders the CTA as a non-navigating span; `stacked` forces the
 * mobile treatment (mobile image + compact type) regardless of viewport.
 */
export function PromoBannerCard({
  banner: b,
  preview = false,
  stacked = false,
}: {
  banner: PromoBannerData;
  preview?: boolean;
  stacked?: boolean;
}) {
  const ctaClass =
    "ring-inner mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-bold text-primary-foreground shadow-glow transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  const desktopSrc = b.imageUrl ?? undefined;
  const mobileSrc = b.imageMobileUrl ?? undefined;

  return (
    // Floating card: 32px radius on all corners, image clipped by overflow-hidden,
    // subtle glass edge (inset white ring) and the site's soft `shadow-glass`.
    <div className="relative overflow-hidden rounded-4xl bg-brand-dark shadow-glass ring-1 ring-inset ring-white/10">
      {/* Background image — absolutely positioned so text overlays it. */}
      {(desktopSrc || mobileSrc) &&
        (stacked ? (
          // Preview mobile: show the mobile image explicitly (media queries can't
          // react to the narrow preview frame on a desktop viewport).
          <Image
            src={mobileSrc ?? desktopSrc!}
            alt={b.title}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <>
            {mobileSrc && (
              <Image
                src={mobileSrc}
                alt={b.title}
                fill
                sizes="100vw"
                className="object-cover object-center sm:hidden"
              />
            )}
            <Image
              src={desktopSrc ?? mobileSrc!}
              alt={b.title}
              fill
              sizes="100vw"
              className={`object-cover object-center ${mobileSrc ? "hidden sm:block" : ""}`}
            />
          </>
        ))}

      {/* Scrim for legibility — bottom-up on mobile, left-to-right on desktop. */}
      <div
        className={
          stacked
            ? "absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10"
            : "absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10 sm:bg-gradient-to-r sm:from-black/80 sm:via-black/45 sm:to-transparent"
        }
      />

      {/* Overlaid content — padding matches the CTA card (p-10). */}
      <div
        className={
          stacked
            ? "relative flex min-h-[200px] flex-col justify-center gap-2.5 p-6"
            : "relative flex min-h-[240px] flex-col justify-center gap-3 p-8 sm:min-h-[300px] sm:p-10 lg:p-12"
        }
      >
        <h3
          className={
            stacked
              ? "max-w-xl font-display text-xl font-extrabold leading-tight text-white drop-shadow"
              : "max-w-2xl font-display text-2xl font-extrabold leading-tight text-white drop-shadow sm:text-3xl lg:text-[40px]"
          }
        >
          {b.title}
        </h3>
        {b.body && (
          <p
            className={
              stacked
                ? "max-w-xl text-[14px] leading-relaxed text-white/85"
                : "max-w-xl text-sm leading-relaxed text-white/85 sm:text-base"
            }
          >
            {b.body}
          </p>
        )}
        {b.ctaLabel &&
          (preview ? (
            <span className={ctaClass}>
              {b.ctaLabel}
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </span>
          ) : (
            b.ctaUrl && (
              <Link href={b.ctaUrl} className={ctaClass}>
                {b.ctaLabel}
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            )
          ))}
      </div>
    </div>
  );
}

/**
 * Promotional banners placed within a page's content, rendered as floating
 * rounded cards inside the site's 1300px container with generous vertical
 * spacing. Fed from PROMO banners via getBannersForPage(); each fades/slides in.
 */
export function PromoBanner({ banners }: { banners: PromoBannerData[] }) {
  const reduceMotion = useReducedMotion();
  if (!banners.length) return null;

  return (
    <section className="mx-auto max-w-[1300px] space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      {banners.map((b) => (
        <motion.div
          key={b.id}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <PromoBannerCard banner={b} />
        </motion.div>
      ))}
    </section>
  );
}
