"use client";

import { formatINR } from "@/lib/accents";
import type { OfferPlanView } from "@/lib/offers/view";
import { OfferPlanTabs, useViewedPlan } from "./OfferItinerary";
import { OfferPlanCta } from "./OfferPlanCta";
import { CompareCellView, type CompareSectionData } from "./OfferCompareCell";

// Phones: instead of a wide table scrolled sideways, one plan at a time —
// plan tabs (shared with the itinerary/stays tabs) and that plan's values as
// a readable list, section by section, ending with its Choose CTA.
export function OfferCompareMobile({
  plans,
  sections,
}: {
  plans: OfferPlanView[];
  sections: CompareSectionData[];
}) {
  const plan = useViewedPlan(plans);
  if (!plan) return null;
  const col = plans.findIndex((p) => p.id === plan.id);

  return (
    <div className="space-y-4">
      <OfferPlanTabs plans={plans} />
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex items-end justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-[17px] font-bold text-foreground">{plan.displayName}</p>
            {plan.badge && (
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                {plan.badge}
              </p>
            )}
          </div>
          <p className="text-right">
            <span className="block text-[22px] font-bold leading-none text-foreground">
              {formatINR(plan.priceForTwo)}
            </span>
            <span className="text-[12px] text-muted-foreground">for 2 adults</span>
          </p>
        </div>
        {sections
          .filter((s) => s.title)
          .map((section) => (
            <div key={section.title}>
              <p className="bg-muted/50 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                {section.title}
              </p>
              <dl className="divide-y divide-border">
                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 px-5 py-3 text-[14px]"
                  >
                    <dt
                      className={row.emphasis ? "font-bold text-foreground" : "text-foreground/80"}
                    >
                      {row.label}
                    </dt>
                    <dd className="shrink-0 text-right text-foreground">
                      <CompareCellView cell={row.cells[col]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        <div className="border-t border-border p-4">
          <div className="[&>button]:w-full">
            <OfferPlanCta plan={plan.name} highlight />
          </div>
        </div>
      </div>
    </div>
  );
}
