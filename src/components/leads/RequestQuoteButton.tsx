"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ReceiptText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";
import { LeadForm } from "@/components/leads/LeadForm";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { REQUEST_QUOTE_LABEL } from "@/lib/tours/cards";
import type { LeadSourcePage } from "@/lib/leads/schema";
import { cn } from "@/lib/utils";

interface RequestQuoteButtonProps {
  /** The tour the quote is for — shown in the modal and stored on the lead. */
  tourName: string;
  /** Either identifies the tour for the CRM; listing cards only know the slug. */
  tourSlug?: string;
  tourId?: string;
  /** "sm" fits a listing card's price row; "md" stands in for a price line. */
  size?: "sm" | "md";
  className?: string;
}

// The page the button sits on, as a Lead.sourcePage tag. Activity pages use
// the listing tag: "activity-detail" marks an activity enquiry (no budget),
// and this is a tour enquiry.
function sourceForPath(pathname: string): LeadSourcePage {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/tours/category")) return "tour-category";
  if (pathname.startsWith("/tours/kashmir-tour-packages-from")) return "tour-origin-city";
  if (pathname === "/tours") return "tours";
  if (pathname.startsWith("/tours/")) return "tour-detail";
  if (pathname.startsWith("/destinations/")) return "destination-detail";
  if (pathname.startsWith("/destinations")) return "destinations";
  if (pathname.startsWith("/blog/")) return "blog-detail";
  if (pathname.startsWith("/blog")) return "blog-list";
  if (pathname.startsWith("/activities")) return "activities";
  if (pathname.startsWith("/plan-your-kashmir-trip")) return "trip-planner";
  return "tour-collection";
}

// "Request Quote" for a price-on-request tour (Tour.hidePrice / REQUEST_QUOTE):
// the CTA that takes the price's place on cards, opening the same <LeadForm />
// the page heroes use — same fields, same lead pipeline — tagged with the tour.
export function RequestQuoteButton({
  tourName,
  tourSlug,
  tourId,
  size = "sm",
  className,
}: RequestQuoteButtonProps) {
  const pathname = usePathname();
  const { formAvatars } = useSiteSettings();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // Cards are clickable as a whole — this must not also open the tour.
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "sweep ring-inner group inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          size === "sm" ? "gap-1.5 px-3.5 py-2 text-[13px]" : "gap-2 px-5 py-2.5 text-[14px]",
          className,
        )}
      >
        <ReceiptText className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.2} />
        {REQUEST_QUOTE_LABEL}
        <ArrowRight
          className={cn(
            "transition-transform group-hover:translate-x-0.5",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
          strokeWidth={2.4}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[20px]">Get a free quote in 15 mins</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-[14px]">
            For <span className="font-semibold text-foreground">{tourName}</span> — quoted for your
            dates and group size.
          </DialogDescription>
          {open && (
            <LeadForm
              source={sourceForPath(pathname ?? "/")}
              context={{
                ...(tourId ? { tourId } : {}),
                ...(tourSlug ? { tourSlug } : {}),
                tourName,
                priceHidden: true,
              }}
              kicker={null}
              title={null}
              buttonLabel={REQUEST_QUOTE_LABEL}
              avatars={formAvatars}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
