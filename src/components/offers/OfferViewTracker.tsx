"use client";

import { useEffect } from "react";
import { trackOfferView } from "@/lib/analytics";
import { useOfferSelection } from "./OfferSelection";

/** Fires offer_view once per page load (same idea as PackageViewTracker). */
export function OfferViewTracker() {
  const { offer } = useOfferSelection();
  useEffect(() => {
    trackOfferView(offer, offer.occasionType);
    // Once per mounted offer page — not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.offerId]);
  return null;
}
