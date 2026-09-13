import type { ServiceKind } from "@prisma/client";
import type { ItineraryData } from "@/types/itinerary";

// Maps an itinerary's hotels/transport/included-activities into booking
// service rows. Pure and itinerary-shape-only (no Lead/Booking/B2B concept
// involved), so it works unchanged for a normal lead's itinerary today and a
// B2B request's itinerary later — both are the same `Itinerary.data` shape
// (see convertLeadToBooking, used by both convert routes).
//
// The itinerary carries no internal cost data (it's the customer-facing
// PDF content), so every row is seeded with amount 0 — staff fills in the
// real cost afterwards on the booking services page.

export interface ItineraryServiceInput {
  kind: ServiceKind;
  name: string;
  amount: number;
  location: string | null;
  nights: number | null;
  roomType: string | null;
  pickup: string | null;
  dropoff: string | null;
  timing: string | null;
}

export function buildServicesFromItinerary(data: ItineraryData): ItineraryServiceInput[] {
  const services: ItineraryServiceInput[] = [];

  for (const h of data.hotels) {
    const name = h.hotelDetails.trim() || h.destination.trim();
    if (!name) continue;
    const nights = parseInt(h.nights, 10);
    services.push({
      kind: "HOTEL",
      name,
      amount: 0,
      location: h.destination.trim() || null,
      nights: Number.isFinite(nights) && nights > 0 ? nights : null,
      roomType: h.roomType.trim() || null,
      pickup: null,
      dropoff: null,
      timing: null,
    });
  }

  if (data.transportType.trim()) {
    services.push({
      kind: "TRANSPORT",
      name: data.transportType.trim(),
      amount: 0,
      location: null,
      nights: null,
      roomType: null,
      pickup: null,
      dropoff: null,
      timing: data.transportDays.trim() || null,
    });
  }

  for (const a of data.activities) {
    const name = a.name.trim();
    if (!name) continue;
    const timing = [a.day.trim(), a.time.trim()].filter(Boolean).join(" · ");
    services.push({
      kind: "ACTIVITY",
      name,
      amount: 0,
      location: a.place.trim() || null,
      nights: null,
      roomType: null,
      pickup: null,
      dropoff: null,
      timing: timing || null,
    });
  }

  return services;
}
