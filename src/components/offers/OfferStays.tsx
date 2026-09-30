"use client";

import { useEffect, useRef, useState } from "react";
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
} from "lucide-react";
import { SafeImage } from "@/components/ui/atoms/SafeImage";
import { cn } from "@/lib/utils";
import type { OfferHotelView, OfferPlanView } from "@/lib/offers/view";
import { OfferPlanTabs, useViewedPlan } from "./OfferItinerary";

/** [1,2,3,4,5] → "5 Nights · 1–5"; [1,2,4] → "3 Nights · 1–2, 4"; [3] → "1 Night · 3". */
function nightsLabel(nights: number[]) {
  const ranges: string[] = [];
  for (let i = 0; i < nights.length; i++) {
    const start = nights[i];
    while (i + 1 < nights.length && nights[i + 1] === nights[i] + 1) i++;
    ranges.push(start === nights[i] ? `${start}` : `${start}–${nights[i]}`);
  }
  return `${nights.length} Night${nights.length === 1 ? "" : "s"} · ${ranges.join(", ")}`;
}

const CARD =
  "group flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition sm:w-[340px]";

// One verified hotel option. A card with a Google link is one big link to the
// hotel's Google profile (new tab).
function HotelCard({ hotel }: { hotel: OfferHotelView }) {
  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <SafeImage
          src={hotel.image}
          alt={hotel.name}
          fill
          sizes="(min-width: 640px) 340px, 85vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
        {hotel.rating && (
          <span
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[12px] font-bold text-foreground backdrop-blur"
            title="Google rating"
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {hotel.rating.toFixed(1)}
          </span>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          <ShieldCheck className="h-3.5 w-3.5" /> Verified
        </span>
        <span className="absolute bottom-3 left-3 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
          {hotel.classLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h4 className="text-[17px] font-bold leading-snug text-foreground">{hotel.name}</h4>
        <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          {[
            hotel.location,
            hotel.place === "Houseboat"
              ? `Houseboat, ${hotel.destinationName}`
              : hotel.destinationName,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
        {hotel.rating && (
          <p className="mt-1.5 text-[13px] text-foreground/80">
            <b>{hotel.rating.toFixed(1)}/5</b> on Google
            {hotel.reviewCount && ` · ${hotel.reviewCount.toLocaleString("en-IN")} reviews`}
          </p>
        )}
        {hotel.googleUrl && (
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] font-semibold text-primary group-hover:underline">
            View on Google <ExternalLink className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </>
  );

  return hotel.googleUrl ? (
    <a
      data-slide
      href={hotel.googleUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`${hotel.name} — open Google profile`}
      className={cn(CARD, "border-border hover:-translate-y-0.5 hover:border-primary/60")}
    >
      {body}
    </a>
  ) : (
    <article data-slide className={cn(CARD, "border-border")}>
      {body}
    </article>
  );
}

// Closes every place's row: "or a similar verified <class>" — the final
// property depends on availability at booking.
function SimilarCard({ sample, hasOptions }: { sample: OfferHotelView; hasOptions: boolean }) {
  return (
    <article data-slide className={cn(CARD, "border-dashed border-primary/40")}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <SafeImage
          src={sample.placeImage}
          alt={sample.destinationName}
          fill
          sizes="(min-width: 640px) 340px, 85vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 grid place-items-center bg-brand-dark/50">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur">
            <Plus className="h-6 w-6" />
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h4 className="text-[17px] font-bold leading-snug text-foreground">
          {hasOptions ? "Or a similar property" : `${sample.classLabel} or similar`}
        </h4>
        <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          {sample.place === "Houseboat"
            ? `Houseboat, ${sample.destinationName}`
            : sample.destinationName}
        </p>
        <p className="mt-auto flex items-start gap-1.5 pt-4 text-[13px] text-foreground/75">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
          {hasOptions
            ? `A verified ${sample.classLabel.toLowerCase()} of the same standard, if these are unavailable.`
            : "Verified property confirmed with your package, subject to availability."}
        </p>
      </div>
    </article>
  );
}

/** One place's options — swipeable row with arrows (2+ cards) and position dots. */
function PlaceCarousel({ items }: { items: OfferHotelView[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Arrows/dots only when the row is wider than the screen — with few cards
  // on a wide screen everything is already visible and there's nothing to slide.
  const [overflows, setOverflows] = useState(false);
  const options = items.filter((h) => !h.placeholder);
  const count = options.length + 1; // + the Similar card

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const step = () => {
      const slide = el.querySelector<HTMLElement>("[data-slide]");
      return slide ? slide.offsetWidth + 16 : 1; // + gap-4
    };
    const onScroll = () => {
      // At the far right the last card may not reach the left edge — count that as the last.
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setActive(atEnd ? count - 1 : Math.min(count - 1, Math.round(el.scrollLeft / step())));
    };
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 4);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [count]);

  const goTo = (i: number) => {
    const el = track.current;
    const slide = el?.querySelector<HTMLElement>("[data-slide]");
    if (el && slide) el.scrollTo({ left: i * (slide.offsetWidth + 16), behavior: "smooth" });
  };

  const sample = items[0];
  const arrow =
    "grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground transition hover:border-primary hover:text-primary disabled:opacity-40";

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] font-bold text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {sample.place === "Houseboat" ? `Houseboat · ${sample.destinationName}` : sample.place}
          <span className="font-medium text-muted-foreground">· {sample.classLabel}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-semibold text-foreground">
            <BedDouble className="h-3.5 w-3.5 text-primary" /> {nightsLabel(sample.nights)}
          </span>
        </h3>
        {overflows && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => goTo(Math.max(0, active - 1))}
              disabled={active === 0}
              aria-label="Previous hotel"
              className={arrow}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(Math.min(count - 1, active + 1))}
              disabled={active >= count - 1}
              aria-label="Next hotel"
              className={arrow}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={track}
        className="-mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:scroll-px-0 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {options.map((h) => (
          <HotelCard key={h.name} hotel={h} />
        ))}
        <SimilarCard sample={sample} hasOptions={options.length > 0} />
      </div>
      {overflows && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show option ${i + 1}`}
              className={cn(
                "h-2 rounded-full transition-all",
                i === active ? "w-6 bg-primary" : "w-2 bg-foreground/20",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// "Where You'll Stay" for the plan picked in the tabs — the real difference
// between plans. One block per place the plan sleeps in (e.g. "Srinagar ·
// Budget Hotel · 3 Nights"), each a carousel of that place's verified hotel
// options (photo, Google rating, location; the card opens its Google profile
// in a new tab) closed by an "or similar" card — the final hotel depends on
// availability. A place without options yet shows just its "or similar" card.
export function OfferStays({ plans }: { plans: OfferPlanView[] }) {
  const plan = useViewedPlan(plans);
  if (!plan || plan.stays.length === 0) return null;

  // Hotels arrive sorted by first night; group them by place, keeping that order.
  const groups: OfferHotelView[][] = [];
  for (const h of plan.hotels) {
    const key = `${h.place}|${h.destinationName}`;
    const group = groups.find((g) => `${g[0].place}|${g[0].destinationName}` === key);
    if (group) group.push(h);
    else groups.push([h]);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px] text-muted-foreground">
          <b className="text-foreground">{plan.name}</b> · {plan.splitLabel}
        </p>
        <OfferPlanTabs plans={plans} />
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-[14px] text-foreground/85">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          <b className="text-foreground">Verified hotel options.</b>
          {
            " The final hotel depends on availability — you'll stay at one of these or a similar property of the same class."
          }
        </span>
      </p>

      <div key={plan.id} className="mt-8 space-y-10">
        {groups.map((items) => (
          <PlaceCarousel key={`${items[0].place}-${items[0].destinationName}`} items={items} />
        ))}
      </div>
    </div>
  );
}
