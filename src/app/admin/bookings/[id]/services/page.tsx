import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parseGstRates } from "@/lib/payments/gst";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { BookingServicesClient } from "@/components/admin/bookings/BookingServicesClient";
import { BookingItineraryCard } from "@/components/admin/bookings/BookingItineraryCard";
import { BookingAdminPanel } from "@/components/admin/bookings/BookingAdminPanel";

export const metadata: Metadata = { title: "Booking Services — Admin" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function parseInclusions(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default async function BookingServicesPage({ params }: PageProps) {
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    include: {
      tour: { select: { title: true } },
      user: { select: { name: true, email: true, mustChangePassword: true } },
      services: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      payments: { orderBy: { createdAt: "asc" } },
      leads: {
        take: 1,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          endDate: true,
          assignedTo: { select: { name: true, email: true } },
          itinerary: { select: { id: true } },
        },
      },
      // Direct-booking itinerary (lead-converted bookings use the lead's instead).
      itinerary: { select: { id: true, status: true } },
    },
  });
  if (!booking) notFound();

  const lead = booking.leads[0] ?? null;

  const data = {
    id: booking.id,
    amount: booking.amount,
    status: booking.status,
    servicesLocked: booking.servicesLocked,
    discountType: booking.discountType,
    discountValue: booking.discountValue,
    inclusions: parseInclusions(booking.inclusions),
    travelDate: booking.travelDate.toISOString(),
    // Travel end comes from the originating lead (the Booking model stores only a
    // single travelDate). null for direct/website bookings with no lead.
    travelEndDate: lead?.endDate ? lead.endDate.toISOString() : null,
    driver: booking.driverAddedAt
      ? {
          driverName: booking.driverName ?? "",
          driverPhone: booking.driverPhone ?? "",
          vehicleNumber: booking.vehicleNumber ?? "",
          vehicleName: booking.vehicleName ?? "",
        }
      : null,
    travellers: booking.travellers,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    tourTitle: booking.tour?.title ?? null,
    customer: booking.user ? { name: booking.user.name, email: booking.user.email } : null,
    lead,
    services: booking.services.map((s) => ({
      id: s.id,
      kind: s.kind,
      name: s.name,
      amount: s.amount,
      location: s.location,
      nights: s.nights,
      roomType: s.roomType,
      pickup: s.pickup,
      dropoff: s.dropoff,
      timing: s.timing,
      sortOrder: s.sortOrder,
    })),
    payments: booking.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      type: p.type,
      method: p.method,
      reference: p.reference,
      note: p.note,
      gstPercent: p.gstPercent,
      gstAmount: p.gstAmount,
      createdAt: p.createdAt.toISOString(),
    })),
  };

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
    select: { gstRates: true },
  });
  const gstRates = parseGstRates(settings?.gstRates);

  // Derived financials for the admin payment panel (single source of truth).
  const finance = computeBookingFinance({
    amount: booking.amount,
    discountType: booking.discountType,
    discountValue: booking.discountValue,
    payments: booking.payments,
    services: booking.services,
  });

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/bookings" className="hover:text-primary transition-colors">Bookings</Link>
          </li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium">Services · {booking.id.slice(-8).toUpperCase()}</li>
        </ol>
      </nav>
      <BookingServicesClient booking={data} gstRates={gstRates} />
      <div className="grid gap-5 lg:grid-cols-2">
        <BookingAdminPanel
          bookingId={booking.id}
          paymentOption={booking.paymentOption}
          status={booking.status}
          razorpayOrderId={booking.razorpayOrderId}
          razorpayPayId={booking.razorpayPayId}
          paidAmount={finance.paidAmount}
          balance={finance.balance}
          paymentStatus={finance.paymentStatus}
          customer={
            booking.user
              ? {
                  email: booking.user.email,
                  name: booking.user.name,
                  mustChangePassword: booking.user.mustChangePassword,
                }
              : null
          }
        />
        <BookingItineraryCard
          bookingId={booking.id}
          servicesLocked={booking.servicesLocked}
          isLeadConverted={!!lead}
          leadItineraryId={lead?.itinerary?.id ?? null}
          itinerary={booking.itinerary ?? null}
        />
      </div>
    </div>
  );
}
