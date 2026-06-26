// Builds the initial itinerary document for a lead by overlaying the lead's
// customer details (name, dates, category, persons, duration) onto the standard
// Kashmir template. Starting price is intentionally 0 — pricing is negotiated
// later and edited in the generator.

import { DEFAULT_ITINERARY_DATA } from "@/components/admin/itinerary/default-data";
import type { ItineraryData } from "@/types/itinerary";

export interface LeadItinerarySeed {
  name: string;
  category: string | null;
  adults: number;
  children: number | null;
  startDate: Date | null;
  endDate: Date | null;
}

const CATEGORY_PACKAGE: Record<string, string> = {
  HONEYMOON_TOUR: "HONEYMOON PACKAGE",
  COUPLE: "COUPLE PACKAGE",
  FAMILY_TOUR: "FAMILY PACKAGE",
  GROUP_TOUR: "GROUP PACKAGE",
  SKI_TOUR: "SKI PACKAGE",
  OFFBEAT_TOUR: "OFFBEAT PACKAGE",
};

function fmtDay(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function travelersLabel(adults: number, children: number | null): string {
  const parts = [`${adults} ${adults === 1 ? "Adult" : "Adults"}`];
  if (children && children > 0) {
    parts.push(`${children} ${children === 1 ? "Child" : "Children"}`);
  }
  return parts.join(" · ");
}

/** The lead-derived presentation fields shown on the itinerary cover/info strip. */
interface DerivedLeadFacts {
  duration: string; // cover (uppercase)
  durationPlain: string; // info-strip tile
  preparedFor: string;
  travelDates: string; // cover (uppercase)
  travelers: string; // cover (uppercase)
  packageType: string;
}

function deriveLeadFacts(lead: LeadItinerarySeed): DerivedLeadFacts {
  let durationPlain = "To be decided";
  let datesLabel = "To be decided";
  if (lead.startDate && lead.endDate) {
    const nights = Math.max(
      0,
      Math.round((lead.endDate.getTime() - lead.startDate.getTime()) / 86_400_000),
    );
    const days = nights + 1;
    durationPlain = `${nights} Nights / ${days} Days`;
    datesLabel = `${fmtDay(lead.startDate)} - ${fmtDay(lead.endDate)}`;
  } else if (lead.startDate) {
    datesLabel = fmtDay(lead.startDate);
  }

  const travelers = travelersLabel(lead.adults, lead.children);
  const packageType = (lead.category && CATEGORY_PACKAGE[lead.category]) || "CUSTOM PACKAGE";

  return {
    duration: durationPlain.toUpperCase(),
    durationPlain,
    preparedFor: lead.name,
    travelDates: datesLabel.toUpperCase(),
    travelers: travelers.toUpperCase(),
    packageType,
  };
}

/** Overlay lead facts onto an itinerary's cover/info fields, preserving the rest. */
function withLeadFacts(data: ItineraryData, lead: LeadItinerarySeed): ItineraryData {
  const f = deriveLeadFacts(lead);
  return {
    ...data,
    duration: f.duration,
    preparedFor: f.preparedFor,
    travelDates: f.travelDates,
    travelers: f.travelers,
   // When category is null (direct booking), preserve the existing packageType so
   // a tour-name seeded at creation isn't reset to "CUSTOM PACKAGE" on every sync.
   packageType: lead.category ? f.packageType : (data.packageType || f.packageType),
    // Keep the info strip's Duration tile in sync with the cover.
    info: data.info.map((it) => (it.id === "info-1" ? { ...it, value: f.durationPlain } : it)),
  };
}

/** Initial itinerary for a new lead: template + lead facts, price starts at 0. */
export function buildLeadItineraryData(lead: LeadItinerarySeed): ItineraryData {
  return withLeadFacts({ ...DEFAULT_ITINERARY_DATA, totalCost: "Rs 0/-" }, lead);
}

/**
 * Re-sync an existing itinerary's lead-derived fields (name, dates, duration,
 * travellers, package type) after the lead changes. Days, hotels, pricing and
 * all other edited content are preserved.
 */
export function applyLeadFactsToItinerary(data: ItineraryData, lead: LeadItinerarySeed): ItineraryData {
  return withLeadFacts(data, lead);
}
