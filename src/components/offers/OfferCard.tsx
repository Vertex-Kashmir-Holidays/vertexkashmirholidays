import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import type { OccasionType } from "@prisma/client";
import { SafeImage } from "@/components/ui/atoms/SafeImage";
import { formatINR } from "@/lib/accents";
import {
  OCCASION_LABELS,
  formatDuration,
  formatOfferDates,
  tripNights,
} from "@/lib/offers/content";

export interface OfferCardData {
  name: string;
  slug: string;
  occasionType: OccasionType;
  startDate: Date | null;
  endDate: Date | null;
  heroTitle: string | null;
  shortDescription: string | null;
  heroImage: string | null;
  fromPrice: number | null;
}

// One published Occasion Offer — used by the /offers hub and the "More
// Seasonal Offers" strip at the end of each offer page.
export function OfferCard({ offer }: { offer: OfferCardData }) {
  const dates = formatOfferDates(offer.startDate, offer.endDate);
  const nights = tripNights(offer.startDate, offer.endDate);
  return (
    <Link
      href={`/offers/${offer.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:border-primary/60"
    >
      <div className="relative aspect-[16/10] bg-muted">
        <SafeImage
          src={offer.heroImage}
          alt={offer.name}
          fill
          sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
          {OCCASION_LABELS[offer.occasionType]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[19px] font-bold leading-snug text-foreground">
          {offer.heroTitle || offer.name}
        </h3>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          {dates && (
            <li className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" /> {dates}
            </li>
          )}
          {nights && nights > 0 && (
            <li className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-primary" /> {formatDuration(nights)}
            </li>
          )}
        </ul>
        {offer.shortDescription && (
          <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-foreground/75">
            {offer.shortDescription}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          {offer.fromPrice !== null ? (
            <p>
              <span className="block text-[12px] text-muted-foreground">From · 2 adults</span>
              <span className="text-[22px] font-bold text-foreground">
                {formatINR(offer.fromPrice)}
              </span>
            </p>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-[14px] font-bold text-primary">
            View offer <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
