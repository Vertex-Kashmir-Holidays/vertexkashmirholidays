"use client";
import { useEffect } from "react";
import { trackCareersViewed } from "@/lib/analytics";

/**
 * Drop this into the careers listing RSC page to fire a careers_viewed event
 * on mount. Renders nothing — pure side-effect component.
 */
export function CareersViewedTracker() {
  useEffect(() => {
    trackCareersViewed();
  }, []);
  return null;
}
