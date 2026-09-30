"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BedDouble, Check, Flag, MapPin, Navigation, PlaneTakeoff } from "lucide-react";
import { SafeImage } from "@/components/ui/atoms/SafeImage";
import { EASE_BRAND } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { OfferDayView, OfferPlanView, OfferStayView } from "@/lib/offers/view";
import { useOfferSelection } from "./OfferSelection";
import { OfferHotelNames } from "./OfferHotelNames";

/** Plan switcher shared by the itinerary and stays sections. */
export function OfferPlanTabs({ plans }: { plans: OfferPlanView[] }) {
  const { viewing, view } = useOfferSelection();
  if (plans.length < 2) return null;
  return (
    <div role="tablist" aria-label="Package" className="flex flex-wrap gap-2">
      {plans.map((p) => {
        const active = (viewing ?? plans[0].name) === p.name;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => view(p.name)}
            className={cn(
              "rounded-full border px-4 py-2 text-[14px] font-semibold transition",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary",
            )}
          >
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

export function useViewedPlan(plans: OfferPlanView[]) {
  const { viewing } = useOfferSelection();
  return plans.find((p) => p.name === viewing) ?? plans[0] ?? null;
}

// Shown on the card: 3 highlights and ~3 lines of description; "Read more"
// reveals the rest, so long days never break the rhythm of the road.
const VISIBLE_HIGHLIGHTS = 3;
const LONG_DESCRIPTION = 170;

function DayCard({
  day,
  stay,
  isLast,
}: {
  day: OfferDayView;
  stay: OfferStayView | undefined;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hiddenHighlights = day.highlights.length - VISIBLE_HIGHLIGHTS;
  const canExpand = day.description.length > LONG_DESCRIPTION || hiddenHighlights > 0;

  // Image | heading · description · highlights, then a full-width
  // "Overnight Stay" footer. Stacks (image on top) when the card is narrow.
  return (
    <motion.article
      // Vertical fade-up: a sideways slide can briefly push a phone's page
      // wider than the screen.
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: EASE_BRAND }}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:border-primary/40"
    >
      <div className="grid sm:grid-cols-[40%_1fr]">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted sm:aspect-auto sm:min-h-[210px]">
          <SafeImage
            src={day.image}
            alt={day.destination?.name ?? day.title}
            fill
            sizes="(min-width: 768px) 220px, (min-width: 640px) 40vw, 90vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {day.destination && (
            <Link
              href={`/destinations/${day.destination.slug}`}
              className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-black/60"
            >
              <MapPin className="h-3.5 w-3.5" /> {day.destination.name}
            </Link>
          )}
        </div>

        <div className="min-w-0 p-5">
          <h3 className="text-[18px] font-bold leading-snug text-foreground">{day.title}</h3>
          {day.description && (
            <p
              className={cn(
                "mt-2 whitespace-pre-line text-[14px] leading-relaxed text-foreground/75",
                !expanded && "line-clamp-3",
              )}
            >
              {day.description}
            </p>
          )}
          {day.highlights.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {(expanded ? day.highlights : day.highlights.slice(0, VISIBLE_HIGHLIGHTS)).map(
                (h) => (
                  <li key={h} className="flex gap-2 text-[13px] font-medium text-foreground/85">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.6} />
                    {h}
                  </li>
                ),
              )}
            </ul>
          )}
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-2 text-[13px] font-semibold text-primary hover:underline"
            >
              {expanded
                ? "Show less"
                : hiddenHighlights > 0
                  ? `Read more · +${hiddenHighlights} highlights`
                  : "Read more"}
            </button>
          )}
        </div>
      </div>

      <p className="flex items-start gap-2 border-t border-border bg-muted/40 px-5 py-3.5 text-[14px] text-foreground/85">
        {isLast || !stay ? (
          <>
            <PlaneTakeoff className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {isLast ? "Departure day" : "Overnight stay to be confirmed"}
          </>
        ) : (
          <>
            <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <b className="text-foreground">Overnight Stay:</b>{" "}
              <OfferHotelNames hotels={stay.hotels} classLabel={stay.classLabel} />
              <span className="text-muted-foreground"> · {stay.place}</span>
            </span>
          </>
        )}
      </p>
    </motion.article>
  );
}

/** Day stop on the road: "Day 3" + weekday/date. */
function RoadStop({ day }: { day: OfferDayView }) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <span className="grid h-12 w-12 place-items-center rounded-full border-4 border-background bg-primary text-[15px] font-bold text-primary-foreground shadow-glow">
        {day.index + 1}
      </span>
      {day.dateLabel && (
        // "Fri, 6 Nov" → weekday over date, so it fits the narrow phone road.
        <span className="mt-1.5 flex flex-col items-center rounded-lg bg-background px-1.5 py-0.5 text-center text-[11px] font-bold uppercase leading-tight tracking-wide text-foreground/80">
          {day.dateLabel.split(", ").map((part) => (
            <span key={part} className="whitespace-nowrap">
              {part}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

// Day by day, as a road trip: a road runs down the page (centre on desktop,
// left edge on phones) with a stop per day; day cards alternate sides on
// desktop. The sightseeing is shared by every plan; the "Overnight" line
// follows the plan chosen in the tabs (night N comes from that plan's stays),
// so a 3-Star visitor sees Pahalgam as an overnight while Budget sees a day
// trip back to Srinagar — without any duplicated itinerary text.
export function OfferItinerary({ days, plans }: { days: OfferDayView[]; plans: OfferPlanView[] }) {
  const plan = useViewedPlan(plans);
  if (days.length === 0) return null;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px] text-muted-foreground">
          Same route for every package — overnight stays shown for{" "}
          <b className="text-foreground">{plan?.name ?? "this trip"}</b>.
        </p>
        <OfferPlanTabs plans={plans} />
      </div>

      <div className="relative mt-10">
        {/* The road: asphalt band with a dashed centre line. */}
        <div
          aria-hidden
          className="absolute bottom-8 left-[23px] top-8 w-3.5 -translate-x-1/2 rounded-full bg-foreground/[0.08] ring-1 ring-foreground/[0.06] md:left-1/2 md:w-5"
        >
          <div
            className="absolute inset-y-2 left-1/2 w-[3px] -translate-x-1/2 opacity-80"
            style={{
              background:
                "repeating-linear-gradient(to bottom, hsl(var(--primary)) 0 14px, transparent 14px 28px)",
            }}
          />
        </div>

        {/* Start of the road. */}
        <div className="relative z-10 mb-6 flex items-center gap-3 md:justify-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-primary/40 bg-card text-primary shadow-sm">
            <Navigation className="h-5 w-5" />
          </span>
          <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
            Start
          </span>
        </div>

        {/* Desktop: from day 2 each row is pulled up alongside the previous
            card, so cards step left/right instead of leaving a blank side. */}
        <ol className="relative flex flex-col gap-8 md:gap-0">
          {days.map((d) => {
            const side = d.index % 2 === 0 ? "left" : "right";
            return (
              <li
                key={d.index}
                className={cn(
                  "grid grid-cols-[48px_1fr] items-start gap-4 md:grid-cols-[1fr_96px_1fr] md:gap-0",
                  d.index > 0 && "md:-mt-24",
                )}
              >
                {/* One card per day — phones: right of the road; desktop:
                    alternating sides, with a short connector to its stop. */}
                <div className="col-start-1 row-start-1 flex justify-center pt-3 md:col-start-2 md:pt-6">
                  <RoadStop day={d} />
                </div>
                <div
                  className={cn(
                    "relative col-start-2 row-start-1",
                    side === "left" ? "md:col-start-1 md:pr-2" : "md:col-start-3 md:pl-2",
                  )}
                >
                  <DayCard
                    day={d}
                    stay={plan?.stays[d.index]}
                    isLast={d.index === days.length - 1}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-10 hidden h-px w-4 bg-primary/50 md:block",
                      side === "left" ? "-right-2" : "-left-2",
                    )}
                  />
                </div>
              </li>
            );
          })}
        </ol>

        {/* End of the road. */}
        <div className="relative z-10 mt-6 flex items-center gap-3 md:justify-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-primary/40 bg-card text-primary shadow-sm">
            <Flag className="h-5 w-5" />
          </span>
          <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
            Trip ends
          </span>
        </div>
      </div>
    </div>
  );
}
