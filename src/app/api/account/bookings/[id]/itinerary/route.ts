import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerBookingWhere } from "@/lib/account/bookingScope";
import { itineraryDataSchema } from "@/types/itinerary";
import { DEFAULT_ITINERARY_DATA } from "@/components/admin/itinerary/default-data";
import { getPdfTrustContent } from "@/lib/itinerary/pdfTrustContent";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const ITINERARY_SELECT = {
  id: true,
  title: true,
  status: true,
  updatedAt: true,
  data: true,
} as const;

/**
 * Customer read of their booking's latest itinerary — direct-booking
 * itineraries live on the booking itself, lead-converted ones on the
 * originating lead (see business-rules.md → Itinerary Rules). Only itineraries
 * staff have marked SENT or CONFIRMED are exposed here; a DRAFT is still a
 * work-in-progress the customer shouldn't see yet.
 */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, ...customerBookingWhere(session.user.id, session.user.email) },
    select: {
      itinerary: { select: ITINERARY_SELECT },
      leads: { take: 1, select: { itinerary: { select: ITINERARY_SELECT } } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const itinerary = booking.itinerary ?? booking.leads[0]?.itinerary ?? null;
  if (!itinerary || itinerary.status === "DRAFT") {
    return NextResponse.json({ error: "Itinerary is not available yet." }, { status: 404 });
  }

  const parsed = itineraryDataSchema.safeParse(itinerary.data);
  const data = parsed.success ? parsed.data : DEFAULT_ITINERARY_DATA;
  const trustContent = await getPdfTrustContent();

  return NextResponse.json({
    id: itinerary.id,
    title: itinerary.title,
    status: itinerary.status,
    updatedAt: itinerary.updatedAt,
    data,
    trustContent,
  });
}
