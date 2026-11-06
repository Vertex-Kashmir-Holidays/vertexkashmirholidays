// Client-safe shapes for the Trips board, hotel stays view and the
// "tour starts tomorrow" celebration. Built server-side in src/lib/trips/board.ts.

export type HotelConfirmationStatus = "PENDING" | "REQUESTED" | "CONFIRMED" | "CANCELLED";

/** Where a trip sits relative to today (IST). */
export type TripBucket = "tomorrow" | "onTour" | "thisWeek" | "upcoming" | "completed";

export const TRIP_BUCKETS: { key: TripBucket; label: string; hint: string }[] = [
  { key: "tomorrow", label: "Starting Tomorrow", hint: "Final checks — hotels confirmed, driver assigned" },
  { key: "onTour", label: "On Tour Now", hint: "Guests currently travelling" },
  { key: "thisWeek", label: "This Week", hint: "Starting in the next 7 days" },
  { key: "upcoming", label: "Upcoming", hint: "Starting later" },
  { key: "completed", label: "Recently Completed", hint: "Ended in the last 30 days" },
];

export const CONFIRMATION_LABELS: Record<HotelConfirmationStatus, string> = {
  PENDING: "Pending",
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

export interface TripHotel {
  id: string;
  name: string;
  location: string | null;
  /** "YYYY-MM-DD" */
  checkIn: string | null;
  checkOut: string | null;
  nights: number | null;
  rooms: number | null;
  roomType: string | null;
  confirmation: HotelConfirmationStatus;
  hotelSupplierId: string | null;
}

export interface TripCard {
  id: string;
  ref: string;
  bucket: TripBucket;
  tourTitle: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  travellers: number;
  /** "YYYY-MM-DD" */
  startDate: string;
  endDate: string | null;
  servicesLocked: boolean;
  isB2b: boolean;
  assignee: { id: string; name: string } | null;
  driver: { name: string; phone: string | null; vehicle: string | null; number: string | null } | null;
  hotels: TripHotel[];
  /** Hotels not yet Confirmed (Cancelled rows excluded). */
  unconfirmedHotels: number;
  /** Cab is a TRANSPORT service — shown in the celebration summary. */
  transport: string[];
}

/** One stay at a hotel, for the Hotel stays view. */
export interface HotelStay extends TripHotel {
  bookingId: string;
  bookingRef: string;
  guestName: string;
  guestPhone: string;
  travellers: number;
  bucket: TripBucket;
  assigneeName: string | null;
  /** Hotel service amount for this stay — set by the per-hotel history only. */
  amount?: number;
}

export interface HotelStayGroup {
  /** HotelSupplier id, or `name:<lowercased name>` for unlinked free-text hotels. */
  key: string;
  name: string;
  destination: string | null;
  linked: boolean;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  stays: HotelStay[];
}
