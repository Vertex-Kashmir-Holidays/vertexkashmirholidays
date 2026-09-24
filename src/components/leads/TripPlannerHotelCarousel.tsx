"use client";

import Image from "next/image";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { imgSrc } from "@/lib/placeholder";
import { HotelLikeButton } from "@/components/leads/HotelLikeButton";
import type { PublicHotel } from "@/lib/hotelSuppliers/stats";

interface TripPlannerHotelCarouselProps {
  hotels: PublicHotel[];
}

const ROW_ID = "trip-planner-hotels-row";

// Real hotel partners Vertex works with — never invented, always sourced
// from the existing Hotel Rates admin module (showOnWebsite: true only).
// This is a recommendation/trust showcase, not a booking engine: the only
// action a card offers is the hotel's own Google Business Profile listing
// (admin-configured, never hard-coded) and the internal Like signal.
//
// Slider mechanics (native scroll-snap + prev/next buttons) match the site's
// existing carousel pattern (src/components/activities/ActivitiesCarousel.tsx)
// — touch-swipeable on mobile, button-driven on desktop, same on both.
export function TripPlannerHotelCarousel({ hotels }: TripPlannerHotelCarouselProps) {
  if (hotels.length === 0) return null;

  const scroll = (direction: "prev" | "next") => {
    const row = document.getElementById(ROW_ID);
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 260;
    row.scrollBy({ left: (direction === "next" ? 1 : -1) * (width + 20) * 2, behavior: "smooth" });
  };

  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-[12px] font-bold tracking-[0.22em] text-primary">OUR HOTEL PARTNERS</p>
          <h2 className="h-display mt-3 text-[18px] font-bold text-foreground">
            Properties we work with in Kashmir
          </h2>
          <p className="mt-2 max-w-lg text-[14px] text-muted-foreground">
            A look at some of the stays our team arranges — liking a property lets us know what
            travellers are drawn to.
          </p>
        </div>
        {hotels.length > 1 && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => scroll("prev")}
              aria-label="Previous"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <button
              onClick={() => scroll("next")}
              aria-label="Next"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        )}
      </div>

      <div id={ROW_ID} className="snap-row mt-8 flex gap-5 overflow-x-auto pb-4">
        {hotels.map((hotel) => (
          <article
            key={hotel.id}
            className="w-[260px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:w-[300px]"
          >
            <div className="relative h-40 overflow-hidden">
              <Image
                src={imgSrc(hotel.coverImageUrl)}
                alt={hotel.hotelName}
                fill
                sizes="300px"
                className="object-cover"
              />
              {hotel.roomImageUrl && (
                <div className="absolute bottom-2 right-2 h-14 w-14 overflow-hidden rounded-lg border-2 border-white/80 shadow-card">
                  <Image
                    src={imgSrc(hotel.roomImageUrl)}
                    alt={`${hotel.hotelName} — room`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-[15px] font-bold text-foreground leading-snug">
                {hotel.hotelName}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{hotel.location}</p>
              {hotel.description && (
                <p className="mt-2 text-[12px] leading-relaxed text-foreground/75">
                  {hotel.description}
                </p>
              )}
              {hotel.rating && (
                <p className="mt-1.5 text-[12px] font-semibold text-gold">{hotel.rating}</p>
              )}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                {hotel.googleProfileUrl && (
                  <a
                    href={hotel.googleProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                    View on Google
                  </a>
                )}
                <HotelLikeButton hotelId={hotel.id} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
