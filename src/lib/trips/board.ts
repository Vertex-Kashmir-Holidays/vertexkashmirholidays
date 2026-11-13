// Trips board data — one place that turns bookings into trip cards, so the
// board, the hotel stays view and the "starts tomorrow" celebration never
// disagree about what a trip is, which bucket it is in, or who can see it.
//
// Visibility is the Bookings rule (bookingWhereForUser): sales see the trips
// converted from their own leads, admins see all.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { toDateInputValue } from "@/lib/bookings/serviceDisplay";
import { hasDriverDetails } from "@/lib/bookings/driver";
import type { Role } from "@/lib/rbac";
import type {
  HotelConfirmationStatus,
  HotelStay,
  HotelStayGroup,
  TripBucket,
  TripCard,
} from "@/lib/trips/types";

const DAY = 86_400_000;
const COMPLETED_LOOKBACK_DAYS = 30;

/** Today's calendar date in India as "YYYY-MM-DD". */
export function todayIst(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** "YYYY-MM-DD" shifted by whole days. */
export function addDays(ymd: string, days: number): string {
  return new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

/**
 * Travel dates are stored as the calendar day at UTC midnight, so the day is
 * the UTC date part. End = travelEndDate, else start + total hotel nights,
 * else the start day itself.
 */
function tripBucket(start: string, end: string, today: string): TripBucket {
  if (end < today) return "completed";
  if (start <= today) return "onTour";
  if (start === addDays(today, 1)) return "tomorrow";
  if (start <= addDays(today, 7)) return "thisWeek";
  return "upcoming";
}

const tripSelect = {
  id: true,
  status: true,
  travelDate: true,
  travelEndDate: true,
  travellers: true,
  guestName: true,
  guestPhone: true,
  guestEmail: true,
  servicesLocked: true,
  driverName: true,
  driverPhone: true,
  vehicleName: true,
  vehicleNumber: true,
  tour: { select: { title: true } },
  leads: {
    select: { b2bAgentId: true, assignedTo: { select: { id: true, name: true, email: true } } },
    take: 1,
  },
  services: {
    where: { kind: { in: ["HOTEL", "TRANSPORT"] } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      kind: true,
      name: true,
      location: true,
      nights: true,
      rooms: true,
      roomType: true,
      checkIn: true,
      checkOut: true,
      hotelSupplierId: true,
      hotelConfirmation: true,
    },
  },
} satisfies Prisma.BookingSelect;

type TripRow = Prisma.BookingGetPayload<{ select: typeof tripSelect }>;

/**
 * A real trip: not deleted/cancelled/failed/refunded, and not an unpaid
 * website request (website bookings stay PENDING until payment; a converted
 * lead's booking is a real trip from the moment it exists).
 */
export const realTrip: Prisma.BookingWhereInput = {
  deletedAt: null,
  status: { notIn: ["CANCELLED", "FAILED", "REFUNDED"] },
  OR: [{ status: { not: "PENDING" } }, { leads: { some: {} } }],
};

function toCard(b: TripRow, today: string): TripCard {
  const start = b.travelDate.toISOString().slice(0, 10);
  const hotels = b.services
    .filter((s) => s.kind === "HOTEL")
    .map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      checkIn: toDateInputValue(s.checkIn),
      checkOut: toDateInputValue(s.checkOut),
      nights: s.nights,
      rooms: s.rooms,
      roomType: s.roomType,
      confirmation: (s.hotelConfirmation ?? "PENDING") as HotelConfirmationStatus,
      hotelSupplierId: s.hotelSupplierId,
    }));
  const totalNights = hotels.reduce((n, h) => n + (h.nights ?? 0), 0);
  const end = b.travelEndDate
    ? b.travelEndDate.toISOString().slice(0, 10)
    : totalNights > 0
      ? addDays(start, totalNights)
      : null;
  const lead = b.leads[0];
  const assignee = lead?.assignedTo
    ? { id: lead.assignedTo.id, name: lead.assignedTo.name ?? lead.assignedTo.email }
    : null;
  return {
    id: b.id,
    ref: b.id.slice(-8).toUpperCase(),
    bucket: tripBucket(start, end ?? start, today),
    tourTitle: b.tour?.title ?? null,
    guestName: b.guestName,
    guestPhone: b.guestPhone,
    guestEmail: b.guestEmail,
    travellers: b.travellers,
    startDate: start,
    endDate: end,
    servicesLocked: b.servicesLocked,
    isB2b: lead?.b2bAgentId != null,
    assignee,
    driver: hasDriverDetails(b)
      ? {
          name: b.driverName!,
          phone: b.driverPhone,
          vehicle: b.vehicleName,
          number: b.vehicleNumber,
        }
      : null,
    hotels,
    unconfirmedHotels: hotels.filter((h) => h.confirmation !== "CONFIRMED" && h.confirmation !== "CANCELLED")
      .length,
    transport: b.services.filter((s) => s.kind === "TRANSPORT").map((s) => s.name),
  };
}

/**
 * Every trip the user can see that is upcoming, under way, or ended within the
 * last 30 days, soonest first (completed trips most recent first).
 */
export async function getTripCards(
  role: Role,
  userId: string,
  now = new Date(),
  opts: { allTime?: boolean } = {},
): Promise<TripCard[]> {
  const today = todayIst(now);
  const rows = await prisma.booking.findMany({
    where: {
      AND: [
        realTrip,
        await bookingWhereForUser(role, userId),
        // Wide enough for any trip still running (end ≥ cutoff is checked per row).
        opts.allTime ? {} : { travelDate: { gte: new Date(`${addDays(today, -60)}T00:00:00Z`) } },
      ],
    },
    orderBy: { travelDate: "asc" },
    select: tripSelect,
  });
  const cutoff = addDays(today, -COMPLETED_LOOKBACK_DAYS);
  const cards = rows
    .map((b) => toCard(b, today))
    .filter((c) => opts.allTime || c.bucket !== "completed" || (c.endDate ?? c.startDate) >= cutoff);
  const completed = cards.filter((c) => c.bucket === "completed").reverse();
  return [...cards.filter((c) => c.bucket !== "completed"), ...completed];
}

/**
 * Trips starting tomorrow (IST) for the celebration: SUPERADMIN sees all,
 * everyone else only the trips assigned to them as salesperson.
 */
export async function getTripsStartingTomorrow(
  role: Role,
  userId: string,
  now = new Date(),
): Promise<TripCard[]> {
  const today = todayIst(now);
  const tomorrow = addDays(today, 1);
  const rows = await prisma.booking.findMany({
    where: {
      AND: [
        realTrip,
        {
          travelDate: {
            gte: new Date(`${tomorrow}T00:00:00Z`),
            lt: new Date(`${addDays(tomorrow, 1)}T00:00:00Z`),
          },
        },
        role === "SUPERADMIN" ? {} : { leads: { some: { assignedToId: userId } } },
      ],
    },
    orderBy: { travelDate: "asc" },
    select: tripSelect,
  });
  return rows.map((b) => toCard(b, today));
}

/**
 * Every hotel stay on trips the user can see, grouped per hotel — linked
 * hotels by HotelSupplier (with its contact details), free-text ones by name.
 */
export async function getHotelStayGroups(
  role: Role,
  userId: string,
  opts: { allTime?: boolean } = {},
): Promise<HotelStayGroup[]> {
  const cards = await getTripCards(role, userId, new Date(), opts);
  const supplierIds = [
    ...new Set(cards.flatMap((c) => c.hotels.map((h) => h.hotelSupplierId).filter(Boolean))),
  ] as string[];
  const suppliers = await prisma.hotelSupplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, hotelName: true, destination: true, data: true },
  });
  const supplierById = new Map(suppliers.map((s) => [s.id, s]));

  const groups = new Map<string, HotelStayGroup>();
  for (const c of cards) {
    for (const h of c.hotels) {
      const sup = h.hotelSupplierId ? supplierById.get(h.hotelSupplierId) : undefined;
      const key = sup ? sup.id : `name:${h.name.trim().toLowerCase()}`;
      let g = groups.get(key);
      if (!g) {
        const property = ((sup?.data as Record<string, unknown> | null)?.property ?? {}) as Record<
          string,
          unknown
        >;
        const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
        g = {
          key,
          name: sup?.hotelName ?? h.name,
          destination: sup?.destination ?? h.location,
          linked: !!sup,
          phone: str(property.phone),
          email: str(property.email),
          contactPerson: str(property.contactPerson),
          stays: [],
        };
        groups.set(key, g);
      }
      const stay: HotelStay = {
        ...h,
        bookingId: c.id,
        bookingRef: c.ref,
        guestName: c.guestName,
        guestPhone: c.guestPhone,
        travellers: c.travellers,
        bucket: c.bucket,
        assigneeName: c.assignee?.name ?? null,
      };
      g.stays.push(stay);
    }
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export interface HotelStayStats {
  stays: number;
  roomNights: number;
  /** "YYYY-MM-DD" of the latest confirmed check-in (or trip start), or null. */
  lastStay: string | null;
  /** Sum of the linked hotel service amounts (what the stays were booked for). */
  amount: number;
}

/**
 * Booking-given stats per hotel in the hotel list — counted only from stays
 * marked CONFIRMED with the hotel, on real (not cancelled/deleted) bookings.
 * One aggregate query (GROUP BY hotel), so the Hotel Rates list never loads
 * stay rows. `ids` limits it to one/some hotels (detail page).
 */
export async function getConfirmedStayStats(ids?: string[]): Promise<Record<string, HotelStayStats>> {
  if (ids && ids.length === 0) return {};
  const rows = await prisma.$queryRaw<
    { id: string; stays: bigint; room_nights: bigint | null; last_stay: Date | null; amount: number | null }[]
  >`
    SELECT bs."hotelSupplierId" AS id,
           COUNT(*) AS stays,
           SUM(COALESCE(bs.rooms, 1) * COALESCE(bs.nights, 0)) AS room_nights,
           MAX(COALESCE(bs."checkIn", b."travelDate"::date)) AS last_stay,
           SUM(bs.amount) AS amount
    FROM "BookingService" bs
    JOIN "Booking" b ON b.id = bs."bookingId"
    WHERE bs.kind = 'HOTEL'
      AND bs."hotelSupplierId" IS NOT NULL
      AND bs."hotelConfirmation" = 'CONFIRMED'
      AND b."deletedAt" IS NULL
      AND b.status NOT IN ('CANCELLED', 'FAILED', 'REFUNDED')
      ${ids ? Prisma.sql`AND bs."hotelSupplierId" IN (${Prisma.join(ids)})` : Prisma.empty}
    GROUP BY bs."hotelSupplierId"
  `;
  const out: Record<string, HotelStayStats> = {};
  for (const r of rows) {
    out[r.id] = {
      stays: Number(r.stays),
      roomNights: Number(r.room_nights ?? 0),
      lastStay: r.last_stay ? r.last_stay.toISOString().slice(0, 10) : null,
      amount: Number(r.amount ?? 0),
    };
  }
  return out;
}

/**
 * Stays booked at one hotel from the hotel list (every confirmation status),
 * newest check-in first, paged in the database — limited to bookings the user
 * can see. `total` is the full count for pagination.
 */
export async function getStaysForHotel(
  role: Role,
  userId: string,
  hotelSupplierId: string,
  { take = 25, skip = 0 }: { take?: number; skip?: number } = {},
): Promise<{ stays: HotelStay[]; total: number }> {
  const today = todayIst();
  const where: Prisma.BookingServiceWhereInput = {
    kind: "HOTEL",
    hotelSupplierId,
    booking: { AND: [realTrip, await bookingWhereForUser(role, userId)] },
  };
  const [rows, total] = await Promise.all([
    prisma.bookingService.findMany({
      where,
      orderBy: [{ checkIn: { sort: "desc", nulls: "last" } }, { booking: { travelDate: "desc" } }],
      take,
      skip,
      select: {
        id: true,
        name: true,
        location: true,
        nights: true,
        rooms: true,
        roomType: true,
        checkIn: true,
        checkOut: true,
        amount: true,
        hotelSupplierId: true,
        hotelConfirmation: true,
        booking: {
          select: {
            id: true,
            guestName: true,
            guestPhone: true,
            travellers: true,
            travelDate: true,
            travelEndDate: true,
            leads: { select: { assignedTo: { select: { name: true, email: true } } }, take: 1 },
          },
        },
      },
    }),
    prisma.bookingService.count({ where }),
  ]);
  const stays = rows.map((r) => {
    const start = r.booking.travelDate.toISOString().slice(0, 10);
    const end = r.booking.travelEndDate?.toISOString().slice(0, 10) ?? start;
    const assignee = r.booking.leads[0]?.assignedTo;
    return {
      id: r.id,
      name: r.name,
      location: r.location,
      checkIn: toDateInputValue(r.checkIn),
      checkOut: toDateInputValue(r.checkOut),
      nights: r.nights,
      rooms: r.rooms,
      roomType: r.roomType,
      confirmation: (r.hotelConfirmation ?? "PENDING") as HotelConfirmationStatus,
      hotelSupplierId: r.hotelSupplierId,
      bookingId: r.booking.id,
      bookingRef: r.booking.id.slice(-8).toUpperCase(),
      guestName: r.booking.guestName,
      guestPhone: r.booking.guestPhone,
      travellers: r.booking.travellers,
      bucket: tripBucket(start, end, today),
      assigneeName: assignee ? (assignee.name ?? assignee.email) : null,
      amount: r.amount,
    } satisfies HotelStay;
  });
  return { stays, total };
}
