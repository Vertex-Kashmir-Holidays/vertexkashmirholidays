"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ensureWhatsAppAttributionToken } from "@/lib/attribution";
import {
  trackOfferPackageSelect,
  trackTourInquiry,
  type OfferAnalyticsContext,
} from "@/lib/analytics";

// Plan + enquiry state shared by the client islands of an Occasion Offer page:
//  - `viewing`: the plan whose itinerary overnights / stays are on screen
//    (tabs; browsing only — no analytics);
//  - `selected`: the plan the visitor chose to enquire about (plan-card CTA or
//    the form's picker) — fires offer_package_select and pre-fills the lead;
//  - `enquiryOpen`: the enquiry form modal (OfferEnquiryModal), opened by
//    every CTA on the page.
// Everything else on the page stays a Server Component.

export interface OfferClientInfo extends OfferAnalyticsContext {
  name: string;
  dates: string | null;
  occasionType: string;
  ctaLabel: string;
}

interface OfferSelectionValue {
  offer: OfferClientInfo;
  selected: string | null;
  select: (plan: string | null) => void;
  viewing: string | null;
  view: (plan: string) => void;
  enquiryOpen: boolean;
  setEnquiryOpen: (open: boolean) => void;
  /** Open the enquiry modal — with `plan`, that plan is pre-selected. */
  openEnquiry: (plan?: string) => void;
}

const Ctx = createContext<OfferSelectionValue | null>(null);

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function OfferSelectionProvider({
  offer,
  defaultPlan,
  children,
}: {
  offer: OfferClientInfo;
  /** Plan shown in the itinerary/stays tabs before the visitor picks one. */
  defaultPlan: string | null;
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(defaultPlan);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  // WhatsApp attribution: this visitor's WhatsApp reference token also carries
  // the offer and chosen plan, so a lead staff create from the chat is tagged
  // automatically (src/app/api/admin/leads/route.ts). Re-minted when the plan
  // changes; every WhatsApp link re-renders with the new reference.
  useEffect(() => {
    ensureWhatsAppAttributionToken({
      offerId: offer.offerId,
      packageName: selected ?? undefined,
    });
  }, [offer.offerId, selected]);

  const select = useCallback(
    (plan: string | null) => {
      setSelected(plan);
      if (plan) {
        setViewing(plan);
        trackOfferPackageSelect(offer, plan);
      }
    },
    [offer],
  );

  const openEnquiry = useCallback(
    (plan?: string) => {
      if (plan) select(plan);
      setEnquiryOpen(true);
      // Same funnel event the tour pages fire when their enquiry form opens.
      trackTourInquiry(offer.name, undefined, plan ?? selected ?? undefined);
    },
    [offer.name, select, selected],
  );

  const value = useMemo(
    () => ({
      offer,
      selected,
      select,
      viewing,
      view: setViewing,
      enquiryOpen,
      setEnquiryOpen,
      openEnquiry,
    }),
    [offer, selected, select, viewing, enquiryOpen, openEnquiry],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOfferSelection(): OfferSelectionValue {
  const value = useContext(Ctx);
  if (!value) throw new Error("useOfferSelection must be used inside <OfferSelectionProvider>");
  return value;
}

/** whatsapp_click offer params (id, slug, chosen plan). */
export const offerClickParams = (offer: OfferClientInfo, plan: string | null) => ({
  offerId: offer.offerId,
  offerSlug: offer.offerSlug,
  packageOption: plan ?? undefined,
});

/** WhatsApp pre-fill for the offer's own CTAs — same wording as the LeadForm's. */
export function offerWhatsAppMessage(offer: OfferClientInfo, plan: string | null): string {
  const dates = offer.dates ? ` (${offer.dates})` : "";
  const pkg = plan ? ` — ${plan} package` : "";
  return `Hi! I'm interested in the ${offer.name}${dates}${pkg}. Please share details.`;
}
