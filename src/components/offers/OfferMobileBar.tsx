"use client";

import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand";
import { useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { trackWhatsappClick } from "@/lib/analytics";
import { offerClickParams, offerWhatsAppMessage, useOfferSelection } from "./OfferSelection";

// Mobile-only sticky CTA: the occasion CTA (opens the enquiry modal) and a
// WhatsApp button, side by side. Hidden on lg+, where the section nav carries
// the CTA; the global mobile tab bar and floating "Plan My Trip" button are
// hidden on offer pages (Navbar.tsx).
export function OfferMobileBar() {
  const { offer, selected, openEnquiry } = useOfferSelection();
  const wa = useWhatsAppLink();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-border bg-card/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => openEnquiry()}
          className="flex min-h-[48px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 text-[15px] font-bold text-primary-foreground shadow-glow active:scale-[0.98]"
        >
          <span className="truncate">{offer.ctaLabel}</span>
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.4} />
        </button>
        <a
          href={wa(offerWhatsAppMessage(offer, selected))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackWhatsappClick(
              "offer_mobile_bar",
              undefined,
              undefined,
              offerClickParams(offer, selected),
            )
          }
          className="flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 text-[15px] font-bold text-white active:scale-[0.98]"
        >
          <WhatsAppIcon className="h-5 w-5" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
