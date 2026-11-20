import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConfirmedStayStats } from "@/lib/trips/board";

export const dynamic = "force-dynamic";

/**
 * Active hotel names for the hotel pickers in proposals, itineraries and
 * booking services (so a stay is spelled exactly as in the hotel list and
 * links up at conversion). Names + destination only — any staff member; never
 * rates or contacts. Hotels we've given bookings to come first (most bookings
 * first), with their confirmed-stay count.
 */
export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || role === "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [rows, stats] = await Promise.all([
    prisma.hotelSupplier.findMany({
      where: { isActive: true },
      orderBy: [{ destination: "asc" }, { hotelName: "asc" }],
      select: { id: true, hotelName: true, destination: true },
    }),
    getConfirmedStayStats(),
  ]);
  const list = rows.map((r) => ({
    id: r.id,
    name: r.hotelName,
    destination: r.destination,
    bookings: stats[r.id]?.stays ?? 0,
  }));
  // Stable sort keeps destination/name order among equal counts.
  list.sort((a, b) => b.bookings - a.bookings);
  return NextResponse.json(list);
}
