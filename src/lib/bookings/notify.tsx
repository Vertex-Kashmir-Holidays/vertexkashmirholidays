// Centralised booking notifications: booking-summary email (on service lock) and
// payment-receipt email (on every recorded payment). Both attach a branded PDF.
// All functions are best-effort and never throw — a failed email/PDF must never
// break the underlying business action (locking services, recording a payment).

import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { computeBookingFinance } from "@/lib/bookings/finance";
import {
  sendMail,
  bookingInvoiceHtml,
  bookingInvoiceText,
  paymentInvoiceHtml,
  paymentInvoiceText,
  type InvoiceService,
} from "@/lib/mail";
import { loadLogoDataUrl } from "@/lib/pdf/assets";
import {
  BookingSummaryPdf,
  PaymentInvoicePdf,
  type PdfService,
} from "@/lib/pdf/InvoiceDocuments";

const bookingRef = (id: string) => id.slice(-8).toUpperCase();

function paymentStatusLabel(payable: number, paid: number): string {
  if (paid <= 0) return "Unpaid";
  if (paid >= payable) return "Paid";
  return "Partially Paid";
}

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
      pickup: s.pickup,
      dropoff: s.dropoff,
      timing: s.timing,
    }));
    const inclusions = parseInclusions(booking.inclusions);
    const ref = bookingRef(booking.id);
    const guestName = booking.guestName || booking.user?.name || "Guest";
    const statusLabel = paymentStatusLabel(finance.effectivePayable, finance.paidAmount);
    const travelDate = fmtDate(booking.travelDate);

    const logo = await loadLogoDataUrl();
    const pdf = await renderToBuffer(
      <BookingSummaryPdf
        logo={logo}
        data={{
          bookingRef: ref,
          guestName,
          travelDate,
          travellers: booking.travellers,
          services: services as PdfService[],
          inclusions,
          bookingAmount: finance.bookingAmount,
          discountAmount: finance.discountAmount,
          effectivePayable: finance.effectivePayable,
          paidAmount: finance.paidAmount,
          balance: finance.balance,
          statusLabel,
        }}
      />,
    );

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
    const statusLabel = paymentStatusLabel(finance.effectivePayable, finance.paidAmount);

    const logo = await loadLogoDataUrl();
    const pdf = await renderToBuffer(
      <PaymentInvoicePdf
        logo={logo}
        data={{
          invoiceRef,
          bookingRef: ref,
          customerName,
          amount: payment.amount,
          type: typeLabel,
          method: payment.method,
          paymentDate,
          effectivePayable: finance.effectivePayable,
          totalPaid: finance.paidAmount,
          balance: finance.balance,
          statusLabel,
        }}
      />,
    );

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
