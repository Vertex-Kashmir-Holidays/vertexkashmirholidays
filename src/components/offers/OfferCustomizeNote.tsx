"use client";

import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { useOfferSelection } from "./OfferSelection";

// "This tour can be customized" — top of The Route section; the button opens
// the enquiry modal so the visitor can say what they'd like changed.
export function OfferCustomizeNote() {
  const { openEnquiry } = useOfferSelection();
  return (
    <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-3 text-[15px] text-foreground/85">
        <SlidersHorizontal className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <span>
          <b className="text-foreground">This tour can be customized.</b> Add nights, change hotels,
          or add activities and transfers — our team will re-price the package for you.
        </span>
      </p>
      <button
        type="button"
        onClick={() => openEnquiry()}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-primary px-5 py-2.5 text-[14px] font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
      >
        Customize my trip
        <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}
