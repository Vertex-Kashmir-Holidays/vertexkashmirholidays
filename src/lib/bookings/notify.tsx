// Centralised booking notifications: booking-summary email (on service lock) and
// payment-receipt email (on every recorded payment). Both attach a branded PDF.
// All functions are best-effort and never throw — a failed email/PDF must never
// break the underlying business action (locking services, recording a payment).

import { prisma } from "@/lib/prisma";
import { computeBookingFinance, PAYMENT_STATUS_LABELS } from "@/lib/bookings/finance";
import { linkBookingCustomer } from "@/lib/bookings/customer";
import { notifyNewBooking } from "@/lib/notifications";
import {
  sendMail,
  customerCredentialsHtml,
  customerCredentialsText,
  bookingConfirmationHtml,
  bookingConfirmationText,
  bookingInvoiceHtml,
  bookingInvoiceText,
  paymentInvoiceHtml,
  paymentInvoiceText,
  driverDetailsHtml,
  driverDetailsText,
  type InvoiceService,
} from "@/lib/mail";
import { renderBookingSummaryPdf, renderPaymentReceiptPdf, bookingRef } from "@/lib/bookings/invoice-pdf";

function parseInclusions(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  TOKEN: "Token / Advance",
  PARTIAL: "Partial Payment",
  FINAL: "Final Payment",
  REFUND: "Refund",
};

async function whatsappNumber(): Promise<string | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
    select: { whatsapp: true, sitePhone: true },
  });
  return settings?.whatsapp ?? settings?.sitePhone ?? null;
}

/**
 * Booking summary email + branded PDF attachment. Sent when services are locked.
 * Rich service detail, but no per-service prices (only the overall price summary).
 */
export async function sendBookingSummaryEmail(bookingId: string): Promise<{ delivered: boolean }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        services: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        payments: { select: { amount: true } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!booking) return { delivered: false };

    const to = booking.guestEmail ?? booking.user?.email ?? null;
    if (!to) return { delivered: false };

    const finance = computeBookingFinance({
      amount: booking.amount,
      discountType: booking.discountType,
      discountValue: booking.discountValue,
      payments: booking.payments,
      services: booking.services,
    });

    const services = booking.services.map((s) => ({
      kind: s.kind,
      name: s.name,
      location: s.location,
      nights: s.nights,
      roomType: s.roomType,
      pickup: s.pickup,
      dropoff: s.dropoff,
      timing: s.timing,
    }));
    const inclusions = parseInclusions(booking.inclusions);
    const ref = bookingRef(booking.id);
    const guestName = booking.guestName || booking.user?.name || "Guest";
    const statusLabel = PAYMENT_STATUS_LABELS[finance.paymentStatus];
    const travelDate = fmtDate(booking.travelDate);

    const rendered = await renderBookingSummaryPdf(booking.id);
    if (!rendered) return { delivered: false };
    const pdf = rendered.buffer;

    const wa = await whatsappNumber();
    const payload = {
      guestName,
      bookingRef: ref,
      travelDate,
      travellers: booking.travellers,
      services: services as InvoiceService[],
      inclusions,
      totalAmount: finance.effectivePayable,
      bookingAmount: finance.bookingAmount,
      discountAmount: finance.discountAmount,
      paidAmount: finance.paidAmount,
      remainingBalance: finance.balance,
      status: statusLabel,
      whatsappNumber: wa,
      bookingId: booking.id,
    };

    const res = await sendMail({
      to,
      subject: "Your Booking Summary — Vertex Kashmir Holidays",
      html: bookingInvoiceHtml(payload),
      text: bookingInvoiceText(payload),
      attachments: [
        { filename: `Vertex-Booking-Summary-${ref}.pdf`, content: pdf, contentType: "application/pdf" },
      ],
    });
    return { delivered: res.delivered };
  } catch (err) {
    console.error("[notify] booking summary email failed", err);
    return { delivered: false };
  }
}

/**
 * Welcome + login-credentials email for a freshly auto-created customer account.
 * Reused by the Lead→Booking conversion and direct-booking flows. Best-effort.
 */
export async function sendCustomerCredentialsEmail(
  email: string,
  name: string,
  tempPassword: string,
): Promise<{ delivered: boolean }> {
  try {
    const res = await sendMail({
      to: email,
      subject: "Your Vertex Kashmir Holidays account",
      html: customerCredentialsHtml({ name, email, tempPassword }),
      text: customerCredentialsText({ name, email, tempPassword }),
    });
    return { delivered: res.delivered };
  } catch (err) {
    console.error("[notify] customer credentials email failed", err);
    return { delivered: false };
  }
}

/**
 * Post-payment finalisation shared by the verify-payment route and the webhook
 * (called once — only when the payment was recorded fresh, so no double-runs):
 *   1. Link the booking to a customer account (create a new one for a new email,
 *      reusing the exact Lead→Booking logic) and email credentials if created.
 *   2. Send the booking confirmation + payment receipt emails.
 * `paidAmount` is what was charged now (advance or full); `ledgerPaymentId` is the
 * BookingPayment row id (for the receipt PDF); `gatewayPaymentId` is the Razorpay id.
 * Best-effort throughout — never throws.
 */
export async function finalizeOnlinePayment(
  bookingId: string,
  paidAmount: number,
  gatewayPaymentId: string,
  ledgerPaymentId: string,
): Promise<void> {
  try {
    const customer = await linkBookingCustomer(bookingId);
    if (customer.created && customer.tempPassword) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { guestName: true, guestEmail: true, user: { select: { name: true, email: true } } },
      });
      const email = booking?.guestEmail ?? booking?.user?.email ?? null;
      const name = booking?.guestName || booking?.user?.name || "Guest";
      if (email) await sendCustomerCredentialsEmail(email, name, customer.tempPassword);
    }
  } catch (err) {
    console.error("[notify] customer link/credentials failed", err);
  }

  await notifyNewBooking(bookingId);
  await sendBookingConfirmationEmail(bookingId, paidAmount, gatewayPaymentId);
  await sendPaymentInvoiceEmail(bookingId, ledgerPaymentId);
}

/**
 * Booking confirmation email sent once a payment is verified (by the client
 * verify-payment route OR the webhook, whichever records the payment first).
 * `paidAmount` is what was actually charged now (advance or full) — not always
 * the booking total. Best-effort; never throws.
 */
export async function sendBookingConfirmationEmail(
  bookingId: string,
  paidAmount: number,
  paymentId: string,
): Promise<{ delivered: boolean }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!booking) return { delivered: false };

    const to = booking.guestEmail ?? booking.user?.email ?? null;
    if (!to) return { delivered: false };

    const tourTitle = booking.tour?.title ?? "Your Tour";
    const wa = await whatsappNumber();
    const payload = {
      guestName: booking.guestName || booking.user?.name || "Guest",
      tourTitle,
      amount: paidAmount,
      travelDate: fmtDate(booking.travelDate),
      travellers: booking.travellers,
      razorpayPayId: paymentId,
      whatsappNumber: wa,
      bookingId: booking.id,
    };

    const res = await sendMail({
      to,
      subject: `Booking Confirmed — ${tourTitle} | Vertex Kashmir Holidays`,
      html: bookingConfirmationHtml(payload),
      text: bookingConfirmationText(payload),
    });
    return { delivered: res.delivered };
  } catch (err) {
    console.error("[notify] booking confirmation email failed", err);
    return { delivered: false };
  }
}

/**
 * Payment receipt email + branded PDF for a single recorded payment. Payment-
 * specific financials only — never the booking's service line items. Used by both
 * the staff "add payment" route and the online payment verification route.
 */
export async function sendPaymentInvoiceEmail(
  bookingId: string,
  paymentId: string,
): Promise<{ delivered: boolean }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!booking) return { delivered: false };

    const payment = booking.payments.find((p) => p.id === paymentId);
    if (!payment) return { delivered: false };

    const to = booking.guestEmail ?? booking.user?.email ?? null;
    if (!to) return { delivered: false };

    const finance = computeBookingFinance({
      amount: booking.amount,
      discountType: booking.discountType,
      discountValue: booking.discountValue,
      payments: booking.payments,
      services: [],
    });

    const ref = bookingRef(booking.id);
    const invoiceRef = payment.id.slice(-8).toUpperCase();
    const customerName = booking.guestName || booking.user?.name || "Guest";
    const typeLabel = PAYMENT_TYPE_LABELS[payment.type] ?? payment.type;
    const paymentDate = fmtDate(payment.createdAt);
    const statusLabel = PAYMENT_STATUS_LABELS[finance.paymentStatus];

    const rendered = await renderPaymentReceiptPdf(booking.id, payment.id);
    if (!rendered) return { delivered: false };
    const pdf = rendered.buffer;

    const wa = await whatsappNumber();
    const payload = {
      customerName,
      bookingRef: ref,
      invoiceRef,
      amount: payment.amount,
      type: typeLabel,
      method: payment.method,
      paymentDate,
      totalPaid: finance.paidAmount,
      remainingBalance: finance.balance,
      status: statusLabel,
      whatsappNumber: wa,
      bookingId: booking.id,
    };

    const res = await sendMail({
      to,
      subject: `Payment Receipt — ${ref} | Vertex Kashmir Holidays`,
      html: paymentInvoiceHtml(payload),
      text: paymentInvoiceText(payload),
      attachments: [
        { filename: `Vertex-Payment-Receipt-${invoiceRef}.pdf`, content: pdf, contentType: "application/pdf" },
      ],
    });
    return { delivered: res.delivered };
  } catch (err) {
    console.error("[notify] payment invoice email failed", err);
    return { delivered: false };
  }
}

/**
 * Driver & vehicle details email to the customer. Sent when staff assign or
 * update the driver for a booking and choose to notify the customer. Best-effort.
 */
export async function sendDriverDetailsEmail(
  bookingId: string,
  opts: { updated?: boolean } = {},
): Promise<{ delivered: boolean }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!booking) return { delivered: false };
    if (!booking.driverName || !booking.driverPhone || !booking.vehicleName || !booking.vehicleNumber) {
      return { delivered: false };
    }

    const to = booking.guestEmail ?? booking.user?.email ?? null;
    if (!to) return { delivered: false };

    const wa = await whatsappNumber();
    const payload = {
      guestName: booking.guestName || booking.user?.name || "Guest",
      driverName: booking.driverName,
      driverPhone: booking.driverPhone,
      vehicleName: booking.vehicleName,
      vehicleNumber: booking.vehicleNumber,
      tourTitle: booking.tour?.title ?? null,
      travelDate: fmtDate(booking.travelDate),
      updated: opts.updated ?? false,
      whatsappNumber: wa,
    };

    const res = await sendMail({
      to,
      subject: `Driver & Vehicle Details — ${bookingRef(booking.id)} | Vertex Kashmir Holidays`,
      html: driverDetailsHtml(payload),
      text: driverDetailsText(payload),
    });
    return { delivered: res.delivered };
  } catch (err) {
    console.error("[notify] driver details email failed", err);
    return { delivered: false };
  }
}
