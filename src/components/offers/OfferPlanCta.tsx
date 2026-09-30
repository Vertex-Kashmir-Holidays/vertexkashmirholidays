"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfferSelection } from "./OfferSelection";

/** "Choose <plan>" — opens the enquiry modal with that plan pre-selected. */
export function OfferPlanCta({ plan, highlight }: { plan: string; highlight?: boolean }) {
  const { openEnquiry } = useOfferSelection();
  return (
    <button
      type="button"
      onClick={() => openEnquiry(plan)}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-[14px] font-bold transition",
        highlight
          ? "bg-primary text-primary-foreground shadow-glow hover:brightness-110"
          : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground",
      )}
    >
      Choose {plan}
      <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
    </button>
  );
}
