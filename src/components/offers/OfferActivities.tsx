"use client";

import { ArrowRight, Info } from "lucide-react";
import { SafeImage } from "@/components/ui/atoms/SafeImage";
import type { OfferActivity } from "@/lib/offers/content";
import { useOfferSelection } from "./OfferSelection";

// "Optional Activities" — add-on cards (e.g. skiing, sledging, pony rides on
// the snow offers), all from Admin → Offers → Content. Priced separately; the
// card button opens the enquiry modal. Phones get a swipeable row, larger
// screens a grid. An optional note (e.g. "Subject to snow and weather") sits
// under the cards.
export function OfferActivities({
  activities,
  note,
}: {
  activities: OfferActivity[];
  note: string | null;
}) {
  const { openEnquiry } = useOfferSelection();
  if (activities.length === 0) return null;

  return (
    <div>
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
        {activities.map((a) => (
          <article
            key={a.title}
            className="group flex w-[80%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft sm:w-auto"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <SafeImage
                src={a.image || null}
                alt={a.title}
                fill
                sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 80vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-foreground backdrop-blur">
                Optional
              </span>
              <h3 className="absolute bottom-3 left-4 right-4 text-[19px] font-bold text-white drop-shadow">
                {a.title}
              </h3>
            </div>
            <div className="flex flex-1 flex-col p-5">
              {a.description && (
                <p className="text-[14px] leading-relaxed text-foreground/80">{a.description}</p>
              )}
              {a.priceNote && (
                <p className="mt-3 text-[14px] font-semibold text-foreground">{a.priceNote}</p>
              )}
              <button
                type="button"
                onClick={() => openEnquiry()}
                className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] font-semibold text-primary hover:underline"
              >
                Add to my trip <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
      {note && (
        <p className="mt-4 flex items-start gap-2 px-1 text-[14px] text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {note}
        </p>
      )}
    </div>
  );
}
