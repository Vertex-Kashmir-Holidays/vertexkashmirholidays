import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { parseJsonBody, parseWithSchema } from "@/lib/api/route-helpers";
import { round2 } from "@/lib/bookings/finance";
import { logPaymentAudit } from "@/lib/bookings/audit";
import { getSiteSettings } from "@/lib/siteSettings";
import { formatStayDate } from "@/lib/itinerary/stayDate";
import {
  sendMail,
  ADMIN_COPY,
  hotelPaymentEmailHtml,
  hotelPaymentEmailSubject,
  hotelPaymentEmailText,
} from "@/lib/mail";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; serviceId: string }> };

const BOOKINGS_FROM = "Vertex Kashmir Holidays Reservations <bookings@vertexkashmirholidays.com>";
const BOOKINGS_EMAIL = "bookings@vertexkashmirholidays.com";

// A first confirmation goes through hotel-payments (the confirm dialog: token
// payment or a waived token). A stay that was confirmed before (it has a hotel
// payment, or its token was waived) can be set back to Confirmed here — no new
// payment, no email. Cancelling needs a reason and can email the hotel a
// cancellation notice with the booking details.
const bodySchema = z
  .object({
    status: z.enum(["PENDING", "REQUESTED", "CONFIRMED", "CANCELLED"]),
    reason: z.string().trim().max(500).optional(),
    sendEmail: z.boolean().default(false),
    emailTo: z.string().trim().optional(),
    guests: z.string().trim().max(200).optional(),
    mealPlan: z.string().trim().max(100).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.status === "CANCELLED" && !d.reason) {
      ctx.addIssue({ code: "custom", message: "Enter the reason for cancelling.", path: ["reason"] });
    }
    if (d.sendEmail && !z.string().email().safeParse(d.emailTo).success) {
      ctx.addIssue({ code: "custom", message: "Enter the hotel's email address.", path: ["emailTo"] });
    }
  });

/** Hotel confirmation status — works after services lock (operations, not the invoice). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id, serviceId } = await params;

  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(bodySchema, body.data);
  if (!parsed.ok) return parsed.response;
  const d = parsed.data;

  const service = await prisma.bookingService.findFirst({
    where: {
      id: serviceId,
      kind: "HOTEL",
      booking: { id, deletedAt: null, ...(await bookingWhereForUser(role, userId)) },
    },
    include: {
      hotelPayments: { select: { amount: true } },
      booking: { select: { id: true, guestName: true, travellers: true } },
    },
  });
  if (!service) return NextResponse.json({ error: "Hotel stay not found" }, { status: 404 });

  if (d.status === "CONFIRMED") {
    if (service.hotelPayments.length === 0 && !service.hotelTokenWaived) {
      return NextResponse.json(
        { error: "This hotel hasn't been confirmed before — confirm it with the token payment (or waive the token)." },
        { status: 409 },
      );
    }
    await prisma.bookingService.update({
      where: { id: serviceId },
      data: {
        hotelConfirmation: "CONFIRMED",
        ...(service.hotelConfirmation !== "CONFIRMED" ? { hotelConfirmedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  }

  // The token waiver is kept, so a stay confirmed without a token can be set
  // back to Confirmed later without asking for a payment.
  await prisma.bookingService.update({
    where: { id: serviceId },
    data: { hotelConfirmation: d.status === "PENDING" ? null : d.status, hotelConfirmedAt: null },
  });

  if (d.status !== "CANCELLED") return NextResponse.json({ ok: true });

  // ── Cancellation: optional notice to the hotel ──────────────────────────
  let emailed = false;
  if (d.sendEmail && d.emailTo) {
    const settings = await getSiteSettings();
    const companyName = settings?.siteName ?? "Vertex Kashmir Holidays";
    const paid = round2(service.hotelPayments.reduce((s, p) => s + p.amount, 0));
    const day = (x: Date | null) => (x ? formatStayDate(x.toISOString().slice(0, 10)) : null);
    const emailData = {
      hotelName: service.name,
      guestName: service.booking.guestName,
      guests: d.guests || `${service.booking.travellers} guests`,
      checkIn: day(service.checkIn),
      checkOut: day(service.checkOut),
      nights: service.nights,
      roomType: service.roomType,
      rooms: service.rooms,
      mealPlan: d.mealPlan || null,
      bookingRef: service.booking.id.slice(-8).toUpperCase(),
      payment: null,
      account:
        service.amount > 0
          ? { total: round2(service.amount), paid, balance: round2(service.amount - paid) }
          : null,
      cancelReason: d.reason!,
      senderName: guard.user.name ?? `${companyName} Reservations`,
      companyName,
      companyPhone: settings?.sitePhone ?? null,
    };
    const result = await sendMail({
      to: d.emailTo,
      bcc: ADMIN_COPY,
      from: BOOKINGS_FROM,
      replyTo: BOOKINGS_EMAIL,
      subject: hotelPaymentEmailSubject(emailData),
      html: hotelPaymentEmailHtml(emailData),
      text: hotelPaymentEmailText(emailData),
    });
    emailed = !!result.delivered;
  }

  await logPaymentAudit({
    event: "HOTEL_CANCELLED",
    bookingId: service.booking.id,
    detail: `${service.name}: ${d.reason}${emailed ? ` (emailed ${d.emailTo})` : ""}`.slice(0, 500),
  });

  return NextResponse.json({ ok: true, emailed });
}
