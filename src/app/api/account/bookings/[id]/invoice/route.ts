import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerBookingWhere } from "@/lib/account/bookingScope";
import { renderBookingSummaryPdf } from "@/lib/bookings/invoice-pdf";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Customer download of their booking-summary invoice PDF. Strictly scoped to the
 * authenticated customer's own booking. The summary invoice only exists once
 * services are finalised (locked), matching the document emailed at lock time.
 */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, ...customerBookingWhere(session.user.id, session.user.email) },
    select: { id: true, servicesLocked: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!booking.servicesLocked) {
    return NextResponse.json({ error: "Invoice is not available yet." }, { status: 404 });
  }

  const rendered = await renderBookingSummaryPdf(booking.id);
  if (!rendered)
    return NextResponse.json({ error: "Could not generate the invoice." }, { status: 500 });

  return new NextResponse(new Uint8Array(rendered.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Vertex-Booking-Summary-${rendered.ref}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
