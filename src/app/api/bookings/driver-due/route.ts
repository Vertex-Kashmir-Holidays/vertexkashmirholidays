import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { isStaff, type Role } from "@/lib/rbac";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { driverDueTravelDateRange, type DriverDueBooking } from "@/lib/bookings/driver";

export const dynamic = "force-dynamic";

/**
 * Bookings the signed-in staff member can see that start tomorrow or today
 * and still have no driver — feeds the blocking DriverDueGate. Staff who
 * can't edit bookings get an empty list (they couldn't add a driver anyway).
 */
export async function GET() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!session?.user || !role || !isStaff(role) || !(await can(role, "bookings", "edit"))) {
    return NextResponse.json({ bookings: [] });
  }

  const rows = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "FAILED", "REFUNDED"] },
      travelDate: driverDueTravelDateRange(),
      // AND, not a spread — the staff scope is itself an OR clause.
      AND: [
        { OR: [{ driverName: null }, { driverName: "" }] },
        await bookingWhereForUser(role, session.user.id as string),
      ],
    },
    orderBy: { travelDate: "asc" },
    select: { id: true, guestName: true, travelDate: true, servicesLocked: true },
  });

  const bookings: DriverDueBooking[] = rows.map((b) => ({
    ...b,
    travelDate: b.travelDate.toISOString(),
  }));
  return NextResponse.json({ bookings });
}
