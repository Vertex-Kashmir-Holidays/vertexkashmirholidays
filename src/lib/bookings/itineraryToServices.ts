import type { ServiceKind } from "@prisma/client";
import type { ItineraryData } from "@/types/itinerary";
import { parseVehicleCount } from "@/lib/vehicleCount";
import { stayDateToDate } from "@/lib/itinerary/travelDates";
import { parseHotelChoices } from "@/lib/proposal/hotelChoices";

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
  // Hotel only. Check-in/out carry over when the itinerary has calendar dates
  // ("2026-06-10" — filled from the travel dates); older free-text labels
  // ("Wed 10 Jun", no year) are left for staff to set.
  rooms?: number | null;
  checkIn?: Date | null;
  checkOut?: Date | null;
  // Transport only: the itinerary's vehicle count (null = 1).
  vehicles?: number | null;
  pickup: string | null;
  dropoff: string | null;
  timing: string | null;
}

// Room type plus any extra beds, e.g. "Deluxe + 1 extra bed + 2 child without
// bed" — the booking service has no bed columns; Room Type carries them.
function hotelRoomType(h: ItineraryData["hotels"][number]): string | null {
  const count = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const extra = count(h.extraBed);
  const cnb = count(h.childWithoutBed);
  const parts = [
    h.roomType.trim(),
    extra ? `${extra} extra bed` : "",
    cnb ? `${cnb} child without bed` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" + ") : null;
}

/**
 * `hotelPicks` (stay id → hotel) is the hotel confirmed for a stay that
 * offered several choices ("Hotel A / Hotel B / Similar", B2B itineraries);
 * a single choice is used as-is, minus any "/ Similar".
 */
export function buildServicesFromItinerary(
  data: ItineraryData,
  hotelPicks: Record<string, string> = {},
): ItineraryServiceInput[] {
  const services: ItineraryServiceInput[] = [];

  for (const h of data.hotels) {
    const { choices } = parseHotelChoices(h.hotelDetails);
    const hotel = hotelPicks[h.id]?.trim() || (choices.length === 1 ? choices[0] : h.hotelDetails.trim());
    const name = hotel || h.destination.trim();
    if (!name) continue;
    const nights = parseInt(h.nights, 10);
    const rooms = parseInt(h.rooms, 10);
    services.push({
      kind: "HOTEL",
      name,
      amount: 0,
      location: h.destination.trim() || null,
      nights: Number.isFinite(nights) && nights > 0 ? nights : null,
      roomType: hotelRoomType(h),
      rooms: Number.isFinite(rooms) && rooms > 0 ? rooms : null,
      checkIn: stayDateToDate(h.checkIn),
      checkOut: stayDateToDate(h.checkOut),
      pickup: null,
      dropoff: null,
      timing: null,
    });
  }

  if (data.transportType.trim()) {
    services.push({
      kind: "TRANSPORT",
      name: data.transportType.trim(),
      vehicles: parseVehicleCount(data.transportCount),
      amount: 0,
      location: null,
      nights: null,
      roomType: null,
      pickup: null,
      dropoff: null,
      timing: data.transportDays.trim() || null,
    });
  }
  for (const v of data.extraVehicles) {
    if (!v.type.trim()) continue;
    services.push({
      kind: "TRANSPORT",
      name: v.type.trim(),
      vehicles: parseVehicleCount(v.count),
      amount: 0,
      location: null,
      nights: null,
      roomType: null,
      pickup: null,
      dropoff: null,
      timing: v.days.trim() || data.transportDays.trim() || null,
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
