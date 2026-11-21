import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { isStaff, type Role } from "@/lib/rbac";
import { getTripsStartingTomorrow } from "@/lib/trips/board";

export const dynamic = "force-dynamic";

/**
 * Trips starting tomorrow (IST) for the celebration dialog: every trip for
 * SUPERADMIN, the signed-in salesperson's own assigned trips for everyone else.
 */
export async function GET() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!session?.user || !role || !isStaff(role) || !(await can(role, "bookings", "view"))) {
    return NextResponse.json({ trips: [] });
  }
  const trips = await getTripsStartingTomorrow(role, session.user.id as string);
  return NextResponse.json({ trips });
}
