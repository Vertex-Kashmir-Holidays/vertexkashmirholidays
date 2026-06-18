import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { sendMail, bookingInvoiceHtml, bookingInvoiceText } from "@/lib/mail";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function parseInclusions(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

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
        error: "Add a customer email before locking services — the invoice is emailed to the customer.",
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

  await prisma.booking.update({ where: { id }, data: { servicesLocked: true } });

  // Summary/invoice email (no per-line service pricing). Email presence is
  // guaranteed by the precondition above; delivery is still reported back.
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
    select: { whatsapp: true, sitePhone: true },
  });
  const payload = {
    guestName: booking.guestName,
    bookingRef: booking.id.slice(-8).toUpperCase(),
    services: booking.services.map((s) => ({ kind: s.kind, name: s.name })),
    inclusions: parseInclusions(booking.inclusions),
    totalAmount: finance.effectivePayable,
    discountAmount: finance.discountAmount,
    paidAmount: finance.paidAmount,
    remainingBalance: finance.balance,
    status: "Partial",
    whatsappNumber: settings?.whatsapp ?? settings?.sitePhone ?? null,
  };
  let emailed = false;
  try {
    const res = await sendMail({
      to,
      subject: "Your Booking Summary — Vertex Kashmir Holidays",
      html: bookingInvoiceHtml(payload),
      text: bookingInvoiceText(payload),
    });
    emailed = res.delivered;
  } catch (err) {
    console.error("[lock-services] invoice email failed", err);
  }

  return NextResponse.json({ ok: true, emailed });
}
