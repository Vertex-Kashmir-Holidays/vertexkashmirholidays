// Builds a standalone itinerary document from an accepted proposal ("Convert to
// Itinerary"), so the final itinerary starts pre-filled instead of from the
// sample template. Copied: cover facts, day plan, the accepted option's
// hotels/vehicle/activities/price, inclusions, payment and cancellation.
// Everything the proposal has no equivalent for (images, trust strip, optional
// activities, transport tags) falls back to the standard itinerary template.

import { DEFAULT_ITINERARY_DATA } from "@/components/admin/itinerary/default-data";
import { STOCK_IMAGES, genId, type ItineraryData } from "@/types/itinerary";
import {
  SINGLE_TIER_KEY,
  COMPARISON_CHECK,
  deriveStayPlan,
  isComparisonDash,
  stayHotelField,
  transportVehicleField,
  type ProposalData,
  type ProposalTierKey,
} from "@/types/proposal";

const FALLBACK_IMAGE = "/itinerary/hero.webp";

/** Stock photo whose place name appears in `text` (e.g. "Gulmarg Excursion"). */
function stockImageFor(text: string): string {
  const t = text.toLowerCase();
  const hit = STOCK_IMAGES.find((img) => t.includes(img.label.split(/[\s(/]/)[0].toLowerCase()));
  return hit?.src ?? FALLBACK_IMAGE;
}

/** A proposal cell's value with the dash sentinel blanked out. */
const cell = (v: string | undefined) => (v && !isComparisonDash(v) ? v.trim() : "");

const isCheck = (v: string) => v === COMPARISON_CHECK || v.toLowerCase() === "yes";

/** `accepted` is the option the customer chose — ignored for a single-package
 *  proposal, which only ever uses its one price box. */
export function proposalToItineraryData(
  proposal: ProposalData,
  accepted: ProposalTierKey,
): ItineraryData {
  const tierKey = proposal.docType === "single" ? SINGLE_TIER_KEY : accepted;
  const tier = proposal.tiers[tierKey];
  const base = DEFAULT_ITINERARY_DATA;

  const days = proposal.days.map((d) => ({
    id: genId("day"),
    title: d.title,
    body: d.body,
    dateLabel: d.dateLabel,
    image: stockImageFor(`${d.title} ${d.stayLabel}`),
    meta: [
      { label: "Meals", value: d.mealsLabel },
      { label: "Stay", value: d.stayLabel },
      { label: "Highlights", value: d.highlightsLine },
    ]
      .filter((m) => m.value.trim())
      .map((m) => ({ id: genId("m"), ...m })),
  }));

  // Hotels: only the accepted option's column. No stay plan → one row per stay
  // place from the day plan, with the hotel name left for staff to fill in.
  const stayRows = proposal.stayPlan.length ? proposal.stayPlan : deriveStayPlan(proposal.days, genId);
  const hotelField = stayHotelField(tierKey);
  const hotels = stayRows.map((r) => {
    const nights = String(Number(r.nights) || 1);
    return {
      id: genId("h"),
      destination: `${r.destination} (${nights}N)`,
      hotelDetails: cell(r[hotelField]),
      hotelAlt: "",
      checkIn: "",
      checkOut: "",
      nights,
      roomType: r.roomType,
      rooms: Number.isInteger(Number(r.rooms)) && Number(r.rooms) >= 1 ? String(Number(r.rooms)) : "1",
      mealType: base.hotels[0].mealType,
      image: stockImageFor(r.destination),
      extraBed: "0",
      childWithBed: "0",
    };
  });

  const vehicleField = transportVehicleField(tierKey);
  const vehicles = proposal.transport.filter((r) => cell(r[vehicleField]));
  const firstVehicle = vehicles[0];

  const activities = proposal.activities
    .filter((a) => cell(a[tierKey]))
    .map((a) => {
      const value = cell(a[tierKey]);
      return {
        id: genId("act"),
        name: a.label,
        place: "",
        time: isCheck(value) ? "" : value,
        image: stockImageFor(a.label),
        day: "",
      };
    });

  const places = [...new Set(proposal.days.map((d) => d.stayLabel.trim()).filter(Boolean))];
  const rooms = hotels[0]?.rooms ?? "1";

  return {
    ...base,
    duration: proposal.duration,
    preparedFor: proposal.preparedFor,
    customerPhone: proposal.customerPhone,
    travelDates: proposal.travelDates,
    travelers: proposal.travelers,
    packageType: `${tier.label} Package`.toUpperCase(),
    totalCost: tier.priceLabel,
    preparedByName: proposal.preparedByName,
    preparedByPhone: proposal.preparedByPhone,
    quoteNumber: proposal.quoteNumber,
    destinations: places.length ? places.join(" · ") : base.destinations,
    info: base.info.map((it) => {
      if (it.id === "info-1") return { ...it, value: proposal.duration };
      if (it.id === "info-3" && firstVehicle) return { ...it, value: cell(firstVehicle[vehicleField]) };
      if (it.id === "info-4") return { ...it, value: `${rooms} ${rooms === "1" ? "Room" : "Rooms"}` };
      return it;
    }),
    days: days.length ? days : base.days,
    hotels,
    activities,
    ...(firstVehicle
      ? {
          transportType: vehicles.map((r) => cell(r[vehicleField])).join(" + "),
          transportDesc: firstVehicle.usedFor,
          transportSeats: firstVehicle.seating,
          transportDays: firstVehicle.duration,
        }
      : {}),
    inc: proposal.inc.length ? proposal.inc : base.inc,
    exc: proposal.exc.length ? proposal.exc : base.exc,
    pay: proposal.pay.length ? proposal.pay : base.pay,
    payStep1Title: proposal.payStep1Title || base.payStep1Title,
    payStep1Desc: proposal.payStep1Desc || base.payStep1Desc,
    payStep2Title: proposal.payStep2Title || base.payStep2Title,
    payStep2Desc: proposal.payStep2Desc || base.payStep2Desc,
    payNote: proposal.payNote || base.payNote,
    cancel: proposal.cancel.length ? proposal.cancel : base.cancel,
    cancelNotes: proposal.cancelNotes.length ? proposal.cancelNotes : base.cancelNotes,
    whyChoose: proposal.whyChoose.length ? proposal.whyChoose : base.whyChoose,
  };
}
