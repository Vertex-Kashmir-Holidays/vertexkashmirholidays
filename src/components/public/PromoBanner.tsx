"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_BRAND as EASE } from "@/lib/motion";
import { useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { trackWhatsappClick } from "@/lib/analytics";
import { isWhatsAppCtaUrl, getWhatsAppCtaMessage } from "@/lib/whatsappCtaUrl";
import { bannerIcon, type BannerFeature } from "@/components/public/bannerIcons";

export interface PromoBannerData {
  id: string;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null; // desktop background
  imageMobileUrl: string | null; // ≤640px background (falls back to imageUrl)
  // SPLIT layout (Banner.layout) — absent/OVERLAY renders the original card.
  layout?: "OVERLAY" | "SPLIT";
  /** SPLIT: content panel + gradient (default) vs content straight on the image. */
  contentBackground?: boolean;
  kicker?: string | null;
  subtitle?: string | null;
  features?: BannerFeature[];
}

/**
 * The banner's CTA — a link, or (for a "whatsapp:<message>" CTA URL set via
 * BannerForm's CTA type toggle) a WhatsApp chat with a proper pre-filled
 * message, built at render time via the same hook every other WhatsApp CTA on
 * the site uses, so it gets the real phone number and attribution ref tag.
 * `preview` renders a non-navigating span (admin live preview).
 */
function BannerCta({
  banner: b,
  preview,
  className,
}: {
  banner: PromoBannerData;
  preview: boolean;
  className: string;
}) {
  const wa = useWhatsAppLink();
  if (!b.ctaLabel) return null;
  const content = (
    <>
      {b.ctaLabel}
      <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
    </>
  );
  if (preview) return <span className={className}>{content}</span>;
  if (isWhatsAppCtaUrl(b.ctaUrl)) {
    return (
      <a
        href={wa(getWhatsAppCtaMessage(b.ctaUrl))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsappClick("promo_banner", { sourcePage: b.id })}
        className={className}
      >
        {content}
      </a>
    );
  }
  return b.ctaUrl ? (
    <Link href={b.ctaUrl} className={className}>
      {content}
    </Link>
  ) : null;
}

// Feature icon tints, cycled per feature (blue, green, orange, violet) — the
// soft-circle + coloured-glyph look from the travel-assistance banner design.
const FEATURE_TINTS = [
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-violet-100 text-violet-700",
];

/**
 * SPLIT promo banner. With a content background (default) the content sits in
 * a full-height panel in the site's own background colour — cream-gold in
 * light mode, navy in dark mode — that fades into the image via a gradient.
 * Without one there's no panel or gradient: the content sits straight on the
 * image (white with a soft shadow). On phones (and the admin "mobile" preview
 * via `stacked`) the full, uncropped image is the background with the content
 * over its top.
 */
function SplitPromoCard({
  banner: b,
  preview,
  stacked,
}: {
  banner: PromoBannerData;
  preview: boolean;
  stacked: boolean;
}) {
  const withBg = b.contentBackground !== false;
  const features = (b.features ?? []).slice(0, 4);
  const desktopSrc = b.imageUrl ?? undefined;
  const mobileSrc = b.imageMobileUrl ?? desktopSrc;
  // `md:` classes apply only when not forced into the stacked (mobile) look.
  const md = (cls: string) => (stacked ? "" : cls);

  // Theme tokens (not fixed colours) so the panel follows the site theme.
  const panelColor = withBg ? "bg-background" : "bg-transparent";
  const panelGradient = withBg
    ? "md:bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background))_62%,hsl(var(--background)/0.85)_80%,hsl(var(--background)/0)_100%)]"
    : "";
  // Without a panel the content sits straight on the image at every size →
  // white with a soft shadow; with one, theme text on the panel colour.
  const onImage = (themeCls: string, imageCls: string) =>
    withBg ? themeCls : `${imageCls} drop-shadow`;

  const text = {
    kicker: onImage("text-foreground/65", "text-white/85"),
    title: onImage("text-foreground", "text-white"),
    subtitle: onImage("text-foreground/90", "text-white/95"),
    body: onImage("text-foreground/75", "text-white/85"),
    featureTitle: onImage("text-foreground", "text-white"),
    featureText: onImage("text-foreground/60", "text-white/80"),
    divider: withBg ? "bg-foreground/15" : "bg-white/30",
  };

  // The image is the card BACKGROUND at every size, shown in full:
  // - mobile / admin mobile preview: the image and the content share one grid
  //   cell, so the card is exactly as tall as the image (or the content, if
  //   taller). The image is anchored to the bottom — mobile art is designed
  //   with empty space at the top for the content and the subject at the
  //   bottom — and any extra height above it takes the panel colour.
  // - md+: fills the card behind the content panel, anchored right (desktop
  //   art has empty space on the left and the subject on the right).
  const imageBlock = (desktopSrc || mobileSrc) && (
    // md:self-auto matters: `self-end` (mobile bottom anchoring) also applies to
    // absolutely positioned boxes, where it shrinks the box to its content —
    // and the desktop image is itself absolute (fill), so without the reset
    // the wrapper collapses to 0px tall and the desktop image disappears.
    <div
      className={`w-full self-end [grid-area:1/1] ${md("md:absolute md:inset-0 md:self-auto")}`}
    >
      <Image
        src={mobileSrc!}
        alt={b.title}
        width={0}
        height={0}
        sizes={stacked ? "400px" : "100vw"}
        className={`block w-full ${md("md:hidden")}`}
        style={{ height: "auto" }}
      />
      {!stacked && (
        <Image
          src={desktopSrc ?? mobileSrc!}
          alt={b.title}
          fill
          sizes="(max-width: 1300px) 100vw, 1300px"
          className="hidden object-cover object-right md:block"
        />
      )}
    </div>
  );

  return (
    <div
      className={`relative grid overflow-hidden rounded-4xl ${
        withBg ? "shadow-glass ring-1 ring-inset ring-border" : ""
      } ${panelColor} ${md("md:block md:min-h-[380px]")}`}
    >
      {imageBlock}

      {/* Mobile: top-down gradient in the panel colour behind the content,
          fading into the image — the vertical twin of the desktop gradient. */}
      {withBg && (
        <div
          aria-hidden
          className={`pointer-events-none bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background))_35%,hsl(var(--background)/0.75)_55%,hsl(var(--background)/0)_78%)] [grid-area:1/1] ${md(
            "md:hidden",
          )}`}
        />
      )}

      {/* Content — over the top of the image on mobile; a full-height panel
          at md+ with its own gradient fading into the image. */}
      <div
        className={`relative z-10 flex flex-col justify-center gap-4 self-start px-6 pb-7 pt-8 [grid-area:1/1] sm:px-8 ${md(
          `md:min-h-[380px] md:w-[60%] md:px-12 md:py-12 lg:px-14 ${panelGradient}`,
        )}`}
      >
        {b.kicker && (
          <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${text.kicker} ${md("md:text-[13px]")}`}>
            {b.kicker}
          </p>
        )}
        <div>
          <h3
            className={`font-display text-[28px] font-extrabold leading-[1.05] ${text.title} ${md(
              "md:text-[44px] lg:text-[52px]",
            )}`}
          >
            {b.title}
          </h3>
          {b.subtitle && (
            <p
              className={`mt-1 font-display text-[22px] font-medium leading-tight ${text.subtitle} ${md(
                "md:text-[34px] lg:text-[40px]",
              )}`}
            >
              {b.subtitle}
            </p>
          )}
          <span className="mt-4 block h-1 w-16 rounded-full bg-primary" aria-hidden />
        </div>
        {b.body && (
          <p className={`max-w-xl text-[14px] leading-relaxed ${text.body} ${md("md:text-[16px]")}`}>
            {b.body}
          </p>
        )}

        {features.length > 0 && (
          <ul
            className={`mt-1 grid gap-3 ${
              features.length >= 3 ? "grid-cols-3" : "grid-cols-2"
            } ${md(features.length === 4 ? "md:grid-cols-4" : "")}`}
          >
            {features.map((f, i) => {
              const Icon = bannerIcon(f.icon);
              return (
                <li key={i} className="relative flex flex-col items-center text-center">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={`absolute -left-1.5 top-3 hidden h-[70%] w-px ${text.divider} ${md("md:block")}`}
                    />
                  )}
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full ${FEATURE_TINTS[i % FEATURE_TINTS.length]} ${md(
                      "md:h-14 md:w-14",
                    )}`}
                  >
                    <Icon className={`h-5 w-5 ${md("md:h-6 md:w-6")}`} strokeWidth={2} />
                  </span>
                  <span className={`mt-2 text-[13px] font-bold ${text.featureTitle} ${md("md:text-[16px]")}`}>
                    {f.title}
                  </span>
                  {f.text && (
                    <span className={`mt-0.5 text-[11px] leading-snug ${text.featureText} ${md("md:text-[13px]")}`}>
                      {f.text}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <BannerCta
          banner={b}
          preview={preview}
          className="mt-2 inline-flex w-fit items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-[15px] font-bold text-primary-foreground shadow-glow transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>
    </div>
  );
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
  if (b.layout === "SPLIT") return <SplitPromoCard banner={b} preview={preview} stacked={stacked} />;

  const ctaClass =
    "ring-inner mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-bold text-primary-foreground shadow-glow transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  const desktopSrc = b.imageUrl ?? undefined;
  const mobileSrc = b.imageMobileUrl ?? undefined;
  // `sm:` classes apply only when not forced into the stacked (mobile) look.
  const sm = (cls: string) => (stacked ? "" : cls);

  return (
    // Floating card: 32px radius, image clipped by overflow-hidden, subtle glass
    // edge and the site's soft `shadow-glass`. The image is the background,
    // always shown in full at its own aspect ratio (next/image width=0/height=0
    // + width:100%/height:auto). Mobile: image and content share one grid cell
    // — content over the top of the image, image anchored to the bottom — with
    // a top-down scrim. sm+: content overlaid with a left-to-right scrim.
    <div
      className={`relative grid overflow-hidden rounded-4xl bg-brand-dark shadow-glass ring-1 ring-inset ring-white/10 ${sm(
        "sm:block sm:min-h-[260px]",
      )}`}
    >
      {(desktopSrc || mobileSrc) && (
        <div className="relative self-end [grid-area:1/1]">
          <Image
            src={mobileSrc ?? desktopSrc!}
            alt={b.title}
            width={0}
            height={0}
            sizes="100vw"
            className={`block w-full ${sm("sm:hidden")}`}
            style={{ height: "auto" }}
          />
          {!stacked && (
            <Image
              src={desktopSrc ?? mobileSrc!}
              alt={b.title}
              width={0}
              height={0}
              sizes="100vw"
              className="hidden w-full sm:block"
              style={{ height: "auto" }}
            />
          )}
          {/* Legibility scrim — top-down on mobile, left-to-right at sm+. */}
          <div
            className={`absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent ${sm(
              "sm:bg-gradient-to-r sm:from-black/80 sm:via-black/45",
            )}`}
          />
        </div>
      )}

      <div
        className={`relative z-10 flex flex-col justify-start gap-2.5 self-start p-6 [grid-area:1/1] ${sm(
          "sm:absolute sm:inset-0 sm:gap-3 sm:p-10 lg:p-12",
        )}`}
      >
        <h3
          className={`max-w-2xl font-display text-xl font-extrabold leading-tight text-white drop-shadow ${sm(
            "sm:text-3xl lg:text-[40px]",
          )}`}
        >
          {b.title}
        </h3>
        {b.body && (
          <p className={`max-w-xl text-[14px] leading-relaxed text-white/85 ${sm("sm:text-base")}`}>
            {b.body}
          </p>
        )}
        <BannerCta banner={b} preview={preview} className={ctaClass} />
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
