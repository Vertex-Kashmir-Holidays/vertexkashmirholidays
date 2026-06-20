// Shared booking-PDF builders. Single source of truth for the booking-summary
// and payment-receipt PDFs, so the documents attached to transactional emails
// (see notify.tsx) are byte-for-byte the same as the ones a customer downloads
// from their account. All functions load their own data and never throw — they
// return null when the booking/payment can't be found.

import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { computeBookingFinance, PAYMENT_STATUS_LABELS } from "@/lib/bookings/finance";
import { loadLogoDataUrl } from "@/lib/pdf/assets";
import { BookingSummaryPdf, PaymentInvoicePdf, type PdfService } from "@/lib/pdf/InvoiceDocuments";

export const bookingRef = (id: string) => id.slice(-8).toUpperCase();

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  TOKEN: "Token / Advance",
  PARTIAL: "Partial Payment",
  FINAL: "Final Payment",
  REFUND: "Refund",
};

function parseInclusions(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Booking summary PDF — rich service detail, NO per-service prices. */
export async function renderBookingSummaryPdf(
  bookingId: string,
): Promise<{ buffer: Buffer; ref: string } | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      services: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      payments: { select: { amount: true } },
      user: { select: { name: true } },
    },
  });
  if (!booking) return null;

  const finance = computeBookingFinance({
    amount: booking.amount,
    discountType: booking.discountType,
    discountValue: booking.discountValue,
    payments: booking.payments,
    services: booking.services,
  });

  const services: PdfService[] = booking.services.map((s) => ({
    kind: s.kind,
    name: s.name,
    location: s.location,
    nights: s.nights,
    pickup: s.pickup,
    dropoff: s.dropoff,
    timing: s.timing,
  }));
  const ref = bookingRef(booking.id);
  const logo = await loadLogoDataUrl();
  const buffer = await renderToBuffer(
    <BookingSummaryPdf
      logo={logo}
      data={{
        bookingRef: ref,
        guestName: booking.guestName || booking.user?.name || "Guest",
        travelDate: fmtDate(booking.travelDate),
        travellers: booking.travellers,
        services,
        inclusions: parseInclusions(booking.inclusions),
        bookingAmount: finance.bookingAmount,
        discountAmount: finance.discountAmount,
        effectivePayable: finance.effectivePayable,
        paidAmount: finance.paidAmount,
        balance: finance.balance,
        statusLabel: PAYMENT_STATUS_LABELS[finance.paymentStatus],
      }}
    />,
  );
  return { buffer, ref };
}

/** Payment receipt PDF — payment-specific financials only (no service lines). */
export async function renderPaymentReceiptPdf(
  bookingId: string,
  paymentId: string,
): Promise<{ buffer: Buffer; ref: string } | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: true, user: { select: { name: true } } },
  });
  if (!booking) return null;
  const payment = booking.payments.find((p) => p.id === paymentId);
  if (!payment) return null;

  const finance = computeBookingFinance({
    amount: booking.amount,
    discountType: booking.discountType,
    discountValue: booking.discountValue,
    payments: booking.payments,
    services: [],
  });

  const ref = bookingRef(booking.id);
  const invoiceRef = payment.id.slice(-8).toUpperCase();
  const logo = await loadLogoDataUrl();
  const buffer = await renderToBuffer(
    <PaymentInvoicePdf
      logo={logo}
      data={{
        invoiceRef,
        bookingRef: ref,
        customerName: booking.guestName || booking.user?.name || "Guest",
        amount: payment.amount,
        type: PAYMENT_TYPE_LABELS[payment.type] ?? payment.type,
        method: payment.method,
        paymentDate: fmtDate(payment.createdAt),
        effectivePayable: finance.effectivePayable,
        totalPaid: finance.paidAmount,
        balance: finance.balance,
        statusLabel: PAYMENT_STATUS_LABELS[finance.paymentStatus],
      }}
    />,
  );
  return { buffer, ref: invoiceRef };
}
