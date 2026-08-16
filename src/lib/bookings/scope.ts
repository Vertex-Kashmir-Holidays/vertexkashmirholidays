// Booking visibility scoping. ADMIN/SUPERADMIN see every booking; every other
// staff role (in practice SALES) sees only bookings converted from a lead
// assigned to them — direct/website bookings have no linked lead and are
// admin-only. Mirrors the ownership pattern already used for leads
// (src/app/api/leads/route.ts: `if (!isAdminOrSuper) where.assignedToId = userId`).

import type { Prisma } from "@prisma/client";
import type { Role } from "@/lib/rbac";

export function bookingWhereForUser(role: Role, userId: string): Prisma.BookingWhereInput {
  if (role === "SUPERADMIN" || role === "ADMIN") return {};
  return { leads: { some: { assignedToId: userId } } };
}
