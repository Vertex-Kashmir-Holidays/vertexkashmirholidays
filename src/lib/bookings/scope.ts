// Booking visibility scoping. ADMIN/SUPERADMIN see every booking; every other
// staff role (in practice SALES) sees only bookings converted from a lead
// assigned to them — direct/website bookings have no linked lead and are
// admin-only. Mirrors the ownership pattern already used for leads
// (src/app/api/leads/route.ts: `if (!isAdminOrSuper) where.assignedToId = userId`).
//
// B2B-converted bookings: a B2B Lead never has assignedToId set (B2B has no
// per-agent assignee), so the ownership rule above never matches them. They
// are visible only to roles authorised for B2B — see canSeeB2bBookings.

import type { Prisma } from "@prisma/client";
import type { Role } from "@/lib/rbac";
import { can } from "@/lib/permissions";

/** B2B bookings are admin business: SUPERADMIN/ADMIN always, any other role
 *  only when granted "B2B Requests → View" in Roles & Permissions. */
export async function canSeeB2bBookings(role: Role): Promise<boolean> {
  return role === "SUPERADMIN" || role === "ADMIN" || (await can(role, "b2bRequests", "view"));
}

export async function bookingWhereForUser(
  role: Role,
  userId: string,
): Promise<Prisma.BookingWhereInput> {
  if (role === "SUPERADMIN" || role === "ADMIN") return {};
  const own: Prisma.BookingWhereInput = { leads: { some: { assignedToId: userId } } };
  if (!(await canSeeB2bBookings(role))) return own;
  return { OR: [own, { leads: { some: { b2bAgentId: { not: null } } } }] };
}
