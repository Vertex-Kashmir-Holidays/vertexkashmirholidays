import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { round2 } from "@/lib/bookings/finance";
import { PAYMENT_METHODS, isCashMethod } from "@/lib/payments/gst";
import { docFileError, storeDocFile } from "@/lib/docs/upload";
import { getSiteSettings } from "@/lib/siteSettings";
import { formatStayDate } from "@/lib/itinerary/stayDate";
import { todayIst } from "@/lib/trips/board";
import {
  sendMail,
  ADMIN_COPY,
  hotelPaymentEmailHtml,
  hotelPaymentEmailText,
  hotelPaymentEmailSubject,
} from "@/lib/mail";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; serviceId: string }> };

const BOOKINGS_FROM = "Vertex Kashmir Holidays Reservations <bookings@vertexkashmirholidays.com>";
const BOOKINGS_EMAIL = "bookings@vertexkashmirholidays.com";

const flag = z.preprocess((v) => v === "1" || v === "true", z.boolean());
const text = z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string());

// Multipart body (the optional receipt rides along). `confirm` also marks the
// stay Confirmed — from the status change; `tokenWaived` confirms with no
// payment at all (a friendly hotel), after the dialog's warning.
const bodySchema = z
  .object({
    confirm: flag.default(false),
    tokenWaived: flag.default(false),
    amount: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().positive("Enter the amount paid").optional()),
    type: z.enum(["TOKEN", "BALANCE"]).optional(),
    method: z.enum(PAYMENT_METHODS).optional(),
    paidBy: text.pipe(z.string().max(120)).optional(),
    sendEmail: flag.default(false),
    emailTo: text.optional(),
    guests: text.pipe(z.string().max(200)).optional(),
    mealPlan: text.pipe(z.string().max(100)).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.tokenWaived && !d.confirm) {
      ctx.addIssue({ code: "custom", message: "Token can only be waived when confirming." });
    }
    if (!d.tokenWaived) {
      if (d.amount === undefined) ctx.addIssue({ code: "custom", message: "Enter the amount paid." });
      if (!d.type) ctx.addIssue({ code: "custom", message: "Choose the payment type." });
      if (!d.method) ctx.addIssue({ code: "custom", message: "Choose how it was paid (Via)." });
      if (!d.paidBy) ctx.addIssue({ code: "custom", message: "Enter who paid (By)." });
    }
    if (d.sendEmail && !z.string().email().safeParse(d.emailTo).success) {
      ctx.addIssue({ code: "custom", message: "Enter the hotel's email address." });
    }
  });

/**
 * Record a payment to the hotel for one stay, optionally confirming the stay
 * and emailing the hotel. Works whether or not the services are locked —
 * paying and confirming the hotel is operations, not the customer invoice.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id, serviceId } = await params;

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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const raw = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
  }
  const d = parsed.data;

  const paidBefore = round2(service.hotelPayments.reduce((s, p) => s + p.amount, 0));
  if (d.amount !== undefined) {
    if (service.amount <= 0) {
      return NextResponse.json(
        { error: "Set this hotel's amount in Booking Services before recording payments." },
        { status: 422 },
      );
    }
    if (round2(paidBefore + d.amount) > service.amount) {
      return NextResponse.json(
        {
          error: `That's more than the balance due to the hotel (₹${round2(service.amount - paidBefore).toLocaleString("en-IN")}).`,
        },
        { status: 422 },
      );
    }
  }

  const file = form.get("receipt");
  const hasFile = file instanceof File && file.size > 0;
  if (hasFile) {
    const err = docFileError(file);
    if (err) return NextResponse.json({ error: err }, { status: 422 });
  }
  if (hasFile && d.tokenWaived) {
    return NextResponse.json({ error: "No payment to attach a receipt to." }, { status: 422 });
  }
  // Cash often has no receipt; every other method must attach one.
  if (!d.tokenWaived && !isCashMethod(d.method) && !hasFile) {
    return NextResponse.json({ error: "Attach the payment receipt (only cash can skip it)." }, { status: 422 });
  }

  const receiptUrl = hasFile ? (await storeDocFile(file, "hotel-receipts")).url : null;
  const now = new Date();

  const [, payment] = await prisma.$transaction([
    prisma.bookingService.update({
      where: { id: serviceId },
      data: d.confirm
        ? {
            hotelConfirmation: "CONFIRMED",
            ...(service.hotelConfirmation !== "CONFIRMED" ? { hotelConfirmedAt: now } : {}),
            hotelTokenWaived: d.tokenWaived,
          }
        : {},
    }),
    ...(d.tokenWaived
      ? []
      : [
          prisma.hotelPayment.create({
            data: {
              serviceId,
              amount: round2(d.amount!),
              type: d.type!,
              method: d.method!,
              paidBy: d.paidBy!,
              receiptUrl,
              recordedById: userId,
            },
          }),
        ]),
  ]);

  // ── Optional email to the hotel ─────────────────────────────────────────
  let emailed = false;
  if (d.sendEmail && d.emailTo) {
    const settings = await getSiteSettings();
    const companyName = settings?.siteName ?? "Vertex Kashmir Holidays";
    // Token, or Partial / Full by whether this payment clears the hotel's amount.
    const cleared = round2(paidBefore + (d.amount ?? 0)) >= round2(service.amount);
    const iso = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : null);
    const day = (x: Date | null) => (x ? formatStayDate(iso(x)!) : null);
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
      payment: d.tokenWaived
        ? null
        : {
            stage: d.type === "TOKEN" ? ("Token" as const) : cleared ? ("Full" as const) : ("Partial" as const),
            amount: round2(d.amount!),
            method: d.method!,
            paidBy: d.paidBy!,
            date: formatStayDate(todayIst(now)),
          },
      account:
        service.amount > 0
          ? {
              total: round2(service.amount),
              paid: round2(paidBefore + (d.amount ?? 0)),
              balance: round2(service.amount - paidBefore - (d.amount ?? 0)),
            }
          : null,
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
      attachments:
        hasFile && file instanceof File
          ? [{ filename: file.name || "receipt", content: Buffer.from(await file.arrayBuffer()), contentType: file.type }]
          : undefined,
    });
    emailed = !!result.delivered;
    if (emailed && payment) {
      await prisma.hotelPayment.update({ where: { id: payment.id }, data: { emailedTo: d.emailTo } });
    }
  }

  return NextResponse.json({
    ok: true,
    emailed,
    payment: payment
      ? { ...payment, emailedTo: emailed ? d.emailTo : null, createdAt: payment.createdAt.toISOString() }
      : null,
  });
}
