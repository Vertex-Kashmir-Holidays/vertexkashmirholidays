import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import { getConfirmedStayStats, getStaysForHotel } from "@/lib/trips/board";
import { canViewHotelStays } from "@/lib/hotelSuppliers/stayAccess";
import { toHotelSupplierRecord } from "@/lib/hotelSuppliers/record";
import { can } from "@/lib/permissions";
import { fmtDay } from "@/components/admin/trips/TripBits";
import { HotelStaysTable } from "@/components/admin/hotel-suppliers/HotelStaysTable";
import { hotelDataSchema } from "@/lib/hotelSuppliers/schema";
import { HotelDetailsCard } from "@/components/admin/hotel-suppliers/HotelDetailsCard";
import { HotelProfilePanel } from "@/components/admin/hotel-suppliers/HotelProfilePanel";

export const metadata: Metadata = { title: "Hotel — Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

// One hotel from the hotel list with every booking we have given it. Stays are
// paged in the database (25 per page) and the headline figures come from one
// aggregate query, so the page stays fast however many bookings pile up.
export default async function AdminHotelDetailPage({ params, searchParams }: PageProps) {
  const guard = await requireModuleView("hotelSuppliers");
  if (!guard.ok) return guard.page;
  const { role, userId } = guard;
  const { id } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);

  const [row, canSeeStays, canEdit, canDelete, canPay, me] = await Promise.all([
    prisma.hotelSupplier.findUnique({ where: { id } }),
    canViewHotelStays(role),
    can(role, "hotelSuppliers", "edit"),
    can(role, "hotelSuppliers", "delete"),
    can(role, "bookings", "edit"),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);
  if (!row) notFound();

  const [stats, staysPage, paidAgg] = await Promise.all([
    getConfirmedStayStats([row.id]),
    canSeeStays
      ? getStaysForHotel(role, userId, row.id, { take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE })
      : Promise.resolve(null),
    // Paid to the hotel across the same confirmed stays as "Booked value".
    prisma.hotelPayment.aggregate({
      _sum: { amount: true },
      where: {
        service: {
          hotelSupplierId: row.id,
          hotelConfirmation: "CONFIRMED",
          booking: { deletedAt: null, status: { notIn: ["CANCELLED", "FAILED", "REFUNDED"] } },
        },
      },
    }),
  ]);
  const hotel = toHotelSupplierRecord(row, stats);
  const s = stats[hotel.id] ?? { stays: 0, roomNights: 0, lastStay: null, amount: 0 };
  const paidTotal = paidAgg._sum.amount ?? 0;
  const hotelData = hotelDataSchema.safeParse(row.data);
  const hotelEmail = hotelData.success ? hotelData.data.property.email : null;
  const pages = staysPage ? Math.max(1, Math.ceil(staysPage.total / PAGE_SIZE)) : 1;

  const kpis = [
    { label: "Bookings given", value: String(s.stays), sub: "Linked & confirmed stays" },
    { label: "Room nights", value: String(s.roomNights) },
    { label: "Booked value", value: inr(s.amount), sub: "Confirmed stays" },
    { label: "Paid to hotel", value: inr(paidTotal), sub: "Confirmed stays" },
    { label: "Balance due", value: inr(Math.max(0, s.amount - paidTotal)), sub: "Confirmed stays" },
    { label: "Last stay", value: s.lastStay ? fmtDay(s.lastStay, true) : "—" },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/admin/hotel-suppliers"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to Hotel Rates
      </Link>

      <HotelProfilePanel
        hotel={hotel}
        canEdit={canEdit}
        canDelete={canDelete}
        linkedStays={staysPage?.total ?? hotel.confirmedStays}
      />

      <HotelDetailsCard data={hotel.data} recommended={hotel.recommended} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {k.label}
            </p>
            <p className="mt-1 text-lg font-extrabold text-foreground">{k.value}</p>
            {k.sub && <p className="text-[11px] text-muted-foreground">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-display font-bold text-foreground">Bookings given to this hotel</h2>
          {staysPage && (
            <span className="text-xs text-muted-foreground">{staysPage.total} total</span>
          )}
        </div>
        {!staysPage ? (
          <p className="p-5 text-sm text-muted-foreground">
            You need Bookings access to see the guests booked at this hotel.
          </p>
        ) : staysPage.stays.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No bookings linked yet — pick this hotel in a booking’s Hotel Details to link a stay.
          </p>
        ) : (
          <HotelStaysTable
            // Re-mount on page change so the client list follows the new page.
            key={page}
            stays={staysPage.stays}
            hotelEmail={hotelEmail}
            canPay={canPay}
            currentUserName={me?.name ?? ""}
          />
        )}
        {staysPage && pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs">
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/hotel-suppliers/${hotel.id}?page=${page - 1}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-semibold hover:bg-muted"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Link>
              )}
              {page < pages && (
                <Link
                  href={`/admin/hotel-suppliers/${hotel.id}?page=${page + 1}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-semibold hover:bg-muted"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
