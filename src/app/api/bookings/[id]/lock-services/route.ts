import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { sendBookingSummaryEmail } from "@/lib/bookings/notify";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Lock a booking's services and email the customer a summary/invoice. */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      services: true,
      payments: { select: { amount: true } },
      user: { select: { email: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.servicesLocked) {
    return NextResponse.json({ error: "Services are already locked." }, { status: 422 });
  }

  // Invoice is sent to the customer's email, so an email is a hard precondition
  // for locking. Fail clearly (do not lock, do not silently skip the invoice) so
  // the user is forced to add a customer email first.
  const to = booking.guestEmail ?? booking.user?.email ?? null;
  if (!to) {
    return NextResponse.json(
      {
        error:
          "Add a customer email before locking services — the invoice is emailed to the customer.",
        code: "EMAIL_REQUIRED",
      },
      { status: 422 },
    );
  }

  const finance = computeBookingFinance({
    amount: booking.amount,
    discountType: booking.discountType,
    discountValue: booking.discountValue,
    payments: booking.payments,
    services: booking.services,
  });

  // Service totals must not exceed the booking amount.
  if (finance.servicesTotal > booking.amount) {
    return NextResponse.json(
      {
        error: `Services total (₹${finance.servicesTotal.toLocaleString("en-IN")}) exceeds the booking amount (₹${booking.amount.toLocaleString("en-IN")}). Adjust services before locking.`,
      },
      { status: 422 },
    );
  }

  // Locking finalises the booking: lifecycle status moves Pending → Confirmed.
  // (Payment status is a separate, derived concept and is not touched here.)
  await prisma.booking.update({
    where: { id },
    data: { servicesLocked: true, status: "CONFIRMED" },
  });

  // Branded summary email + PDF (rich service detail, no per-line pricing). Email
  // presence is guaranteed by the precondition above; delivery is reported back.
  const { delivered: emailed } = await sendBookingSummaryEmail(id);

  return NextResponse.json({ ok: true, emailed });
}
