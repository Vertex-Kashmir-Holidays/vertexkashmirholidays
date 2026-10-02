import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { syncBookingCommission } from "@/lib/bookings/commissionSync";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { sendBookingSummaryEmail } from "@/lib/bookings/notify";
import { logPaymentAudit, wasServicesUnlocked } from "@/lib/bookings/audit";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Lock a booking's services and email the customer a summary/invoice. On a
 * re-lock (after an admin unlock) the email is optional: body { sendEmail: false }. */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, ...bookingWhereForUser(role, userId) },
    include: {
      services: true,
      payments: { select: { amount: true, type: true, gstAmount: true } },
      user: { select: { email: true } },
      leads: { take: 1, select: { id: true, locked: true, status: true, b2bAgentId: true } },
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

  // The first lock always emails the invoice; only a re-lock may skip it.
  const body = (await req.json().catch(() => ({}))) as { sendEmail?: unknown };
  const isRelock = await wasServicesUnlocked(id);
  const sendEmail = !isRelock || body.sendEmail !== false;

  // Locking finalises the booking: lifecycle status moves Pending → Confirmed.
  // (Payment status is a separate, derived concept and is not touched here.)
  // A lead-converted booking's itinerary is the lead's: locking the booking
  // re-locks a lead an admin had unlocked for corrections (see unlock-services).
  const lead = booking.leads[0];
  const relockLead = !!lead && !lead.b2bAgentId && lead.status === "CONVERTED" && !lead.locked;
  await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { servicesLocked: true, status: "CONFIRMED" },
    }),
    ...(relockLead
      ? [
          prisma.lead.update({ where: { id: lead.id }, data: { locked: true } }),
          prisma.itinerary.updateMany({ where: { leadId: lead.id }, data: { locked: true } }),
          prisma.leadActivity.create({
            data: {
              leadId: lead.id,
              type: "NOTE_ADDED",
              note: "Lead re-locked (booking services locked).",
              performedById: userId,
              performedByName: (guard.user.name ?? guard.user.email) as string,
            },
          }),
        ]
      : []),
  ]);

  // Service costs are now final — recompute the commission (if any) now that
  // profit is actually knowable.
  await syncBookingCommission(prisma, id);

  // Branded summary email + PDF (rich service detail, no per-line pricing). Email
  // presence is guaranteed by the precondition above; delivery is reported back.
  const emailed = sendEmail ? (await sendBookingSummaryEmail(id)).delivered : false;

  if (isRelock) {
    await logPaymentAudit({
      event: "SERVICES_RELOCKED",
      bookingId: id,
      status: "success",
      detail: `Re-locked by ${guard.user.name ?? guard.user.email}${sendEmail ? "; summary emailed" : "; no email"}`,
    });
  }

  return NextResponse.json({ ok: true, emailed });
}
