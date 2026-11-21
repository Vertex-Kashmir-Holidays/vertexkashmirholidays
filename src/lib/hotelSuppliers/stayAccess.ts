import { can } from "@/lib/permissions";
import type { Role } from "@/lib/rbac";

/**
 * A hotel's booked stays show guest names, phones and service amounts, so they
 * need Bookings → View on top of Hotel Rates → View. The stays themselves are
 * further scoped to the bookings the user can see (bookingWhereForUser).
 */
export async function canViewHotelStays(role: Role): Promise<boolean> {
  return (await can(role, "hotelSuppliers", "view")) && (await can(role, "bookings", "view"));
}
