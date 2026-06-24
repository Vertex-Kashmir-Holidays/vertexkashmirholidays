import type { Prisma } from "@prisma/client";

// A customer's bookings are those linked to their account (userId) OR made as a
// guest with their verified login email. Email is the unique, verified login key,
// so matching on it is safe — and it recovers bookings whose userId link was
// missed or mis-resolved (e.g. a non-unique phone matched the wrong account).
export function customerBookingWhere(
  userId: string,
  email?: string | null,
): Prisma.BookingWhereInput {
  const norm = email?.trim().toLowerCase() || null;
  return {
    deletedAt: null,
    OR: norm ? [{ userId }, { guestEmail: norm }] : [{ userId }],
  };
}
