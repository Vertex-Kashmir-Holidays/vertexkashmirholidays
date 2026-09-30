"use client";

import { ArrowRight, BedDouble, Car, Check, Utensils } from "lucide-react";
import { SafeImage } from "@/components/ui/atoms/SafeImage";
import { formatINR } from "@/lib/accents";
import { cn } from "@/lib/utils";
import type { OfferPlanView } from "@/lib/offers/view";
import { scrollToSection, useOfferSelection } from "./OfferSelection";

// "Choose Your Plan" — one card per published tier. Same route for everyone;
// what changes is where you sleep, so each card leads with its night split,
// then price for 2, then what's different. The CTA pre-selects the plan in the
// enquiry modal. Phones get a swipeable row; tablets 2-up; desktop 4-up.
export function OfferPlans({ plans }: { plans: OfferPlanView[] }) {
  const { selected, openEnquiry, view } = useOfferSelection();
  if (plans.length === 0) return null;

  return (
    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 pt-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
      {plans.map((p) => {
        const isSelected = selected === p.name;
        return (
          <article
            key={p.id}
            className={cn(
              "relative flex w-[86%] shrink-0 snap-center flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition sm:w-auto",
              isSelected
                ? "border-primary ring-2 ring-primary/40"
                : p.badge
                  ? "border-primary/50"
                  : "border-border",
            )}
          >
            <div className="relative aspect-[16/10] bg-muted">
              <SafeImage
                src={p.image}
                alt={`${p.displayName} stay`}
                fill
                sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 86vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-4 text-[20px] font-bold text-white drop-shadow">
                {p.displayName}
              </span>
              {p.badge && (
                <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow">
                  {p.badge}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold leading-none text-foreground">
                  {formatINR(p.priceForTwo)}
                </span>
                {p.originalPriceForTwo && (
                  <span className="text-[15px] text-muted-foreground line-through">
                    {formatINR(p.originalPriceForTwo)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">Total for 2 adults</p>
              {p.description && (
                <p className="mt-3 text-[14px] leading-relaxed text-foreground/80">
                  {p.description}
                </p>
              )}

              {p.split.length > 0 && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                    <BedDouble className="h-3.5 w-3.5" /> Where you stay
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {p.split.map((s) => (
                      <li
                        key={s.label}
                        className="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-semibold text-foreground"
                      >
                        {s.nights}N {s.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(p.mealPlan || p.vehicle) && (
                <ul className="mt-4 space-y-1.5 text-[13px] text-foreground/80">
                  {p.mealPlan && (
                    <li className="flex items-center gap-2">
                      <Utensils className="h-3.5 w-3.5 text-primary" /> {p.mealPlan}
                    </li>
                  )}
                  {p.vehicle && (
                    <li className="flex items-center gap-2">
                      <Car className="h-3.5 w-3.5 text-primary" /> {p.vehicle}
                    </li>
                  )}
                </ul>
              )}

              {p.highlights.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {p.highlights.slice(0, 5).map((h) => (
                    <li key={h} className="flex gap-2 text-[14px] text-foreground/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto space-y-2 pt-5">
                <button
                  type="button"
                  onClick={() => openEnquiry(p.name)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-bold transition",
                    isSelected || p.badge
                      ? "bg-primary text-primary-foreground shadow-glow hover:brightness-110"
                      : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  {isSelected ? "Selected — enquire" : `Choose ${p.name}`}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    view(p.name);
                    scrollToSection("itinerary");
                  }}
                  className="w-full py-1.5 text-[13px] font-semibold text-muted-foreground transition hover:text-primary"
                >
                  See this package&apos;s itinerary
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
