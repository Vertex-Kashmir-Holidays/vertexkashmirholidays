import { CmsCtaLink } from "@/components/common/CmsCtaLink";
import { OfferCard, type OfferCardData } from "@/components/offers/OfferCard";
import { renderAccents } from "@/lib/accents";
import type { SectionHeading } from "@/types/home";

interface OffersSectionProps {
  heading: SectionHeading;
  offers: OfferCardData[];
}

// Homepage seasonal offers — the published Occasion Offers (same cards as the
// /offers hub). Hidden entirely when none are published.
export function OffersSection({ heading, offers }: OffersSectionProps) {
  if (offers.length === 0) return null;

  return (
    <section
      id="offers"
      className="relative z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rv text-[12px] font-bold tracking-[0.22em] text-primary">
            {heading.kicker}
          </p>
          <h2
            className="rv h-display mt-3 text-[18px] font-bold text-foreground"
            style={{ "--rd": "0.08s" } as React.CSSProperties}
          >
            {renderAccents(heading.title)}
          </h2>
          {heading.subtitle && (
            <p
              className="rv mt-3 max-w-md text-sm text-muted-foreground"
              style={{ "--rd": "0.14s" } as React.CSSProperties}
            >
              {heading.subtitle}
            </p>
          )}
        </div>
        {heading.ctaLabel && (
          <CmsCtaLink
            href={heading.ctaHref ?? "/offers"}
            source="home_section_cta"
            className="rv inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            style={{ "--rd": "0.2s" } as React.CSSProperties}
          >
            {heading.ctaLabel}
          </CmsCtaLink>
        )}
      </div>
      <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((o) => (
          <OfferCard key={o.slug} offer={o} />
        ))}
      </div>
    </section>
  );
}
