import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerBookingWhere } from "@/lib/account/bookingScope";
import { resolveTokenPaymentLink } from "@/lib/itinerary/tokenPaymentLink";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Customer-side resolve of their booking's itinerary token Payment Link — same
 * scoping as GET .../itinerary (direct-booking itinerary, else the originating
 * lead's), only exposed once staff has marked it SENT/CONFIRMED.
 */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, ...customerBookingWhere(session.user.id, session.user.email) },
    select: {
      itinerary: { select: { id: true, status: true } },
      leads: { take: 1, select: { itinerary: { select: { id: true, status: true } } } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const itinerary = booking.itinerary ?? booking.leads[0]?.itinerary ?? null;
  if (!itinerary || itinerary.status === "DRAFT") {
    return NextResponse.json({ error: "Itinerary is not available yet." }, { status: 404 });
  }

  const result = await resolveTokenPaymentLink(itinerary.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 502 });

  return NextResponse.json(result);
}
