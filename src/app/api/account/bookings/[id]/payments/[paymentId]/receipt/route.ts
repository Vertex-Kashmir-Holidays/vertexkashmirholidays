import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerBookingWhere } from "@/lib/account/bookingScope";
import { renderPaymentReceiptPdf } from "@/lib/bookings/invoice-pdf";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; paymentId: string }> };

/**
 * Customer download of a single payment-receipt PDF. Scoped to the authenticated
 * customer's own booking, and the payment must belong to that booking. Matches the
 * receipt emailed when the payment was recorded.
 */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, paymentId } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, ...customerBookingWhere(session.user.id, session.user.email) },
    select: { id: true, payments: { where: { id: paymentId }, select: { id: true } } },
  });
  if (!booking || booking.payments.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rendered = await renderPaymentReceiptPdf(booking.id, paymentId);
  if (!rendered) return NextResponse.json({ error: "Could not generate the receipt." }, { status: 500 });

  return new NextResponse(new Uint8Array(rendered.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Vertex-Payment-Receipt-${rendered.ref}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
