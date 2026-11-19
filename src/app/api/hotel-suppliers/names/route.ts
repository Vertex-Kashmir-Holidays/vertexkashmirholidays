import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Active hotel names for the hotel pickers in proposals, itineraries and
 * booking services (so a stay is spelled exactly as in the hotel list and
 * links up at conversion). Names + destination only — any staff member; never
 * rates or contacts.
 */
export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || role === "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.hotelSupplier.findMany({
    where: { isActive: true },
    orderBy: [{ destination: "asc" }, { hotelName: "asc" }],
    select: { id: true, hotelName: true, destination: true },
  });
  return NextResponse.json(rows.map((r) => ({ id: r.id, name: r.hotelName, destination: r.destination })));
}
