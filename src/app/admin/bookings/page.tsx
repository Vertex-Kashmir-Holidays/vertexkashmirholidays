import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { getBookingCardStats } from "@/lib/bookings/cardStats";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import { BookingsClient } from "@/components/admin/bookings/BookingsClient";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Bookings — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const guard = await requireModuleView("bookings");
  if (!guard.ok) return guard.page;
  const { role, userId } = guard;

  const canDelete = await can(role, "bookings", "delete");
  // Cancellation/refund are admin-only business actions (server-enforced too).
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  const where: Prisma.BookingWhereInput = { deletedAt: null, ...bookingWhereForUser(role, userId) };

  // Only the first page (matching BookingsClient's default page size) is
  // fetched server-side for a fast initial paint — every subsequent
  // page/search/filter change is handled client-side via /api/bookings,
  // the same already-existing paginated endpoint, instead of the previous
  // approach of loading (and silently capping at) the first 100 rows.
  const [rows, totalCount, cardStats] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        razorpayOrderId: true,
        razorpayPayId: true,
        status: true,
        amount: true,
        discountType: true,
        discountValue: true,
        travelDate: true,
        travellers: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        createdAt: true,
        tour: { select: { title: true, slug: true, coverImage: true } },
        user: { select: { name: true, email: true } },
        payments: { select: { amount: true, type: true } },
        leads: { take: 1, select: { assignedTo: { select: { name: true, email: true } } } },
      },
    }),
    prisma.booking.count({ where }),
    getBookingCardStats(role, userId),
  ]);

  // Derive payment status (Pending/Partial/Full) per booking from its ledger so
  // the list shows it alongside the lifecycle status, consistently with the rest
  // of the app. Strip the raw payments array before sending to the client.
  const bookings = rows.map(({ payments, leads, ...b }) => {
    const finance = computeBookingFinance({
      amount: b.amount,
      discountType: b.discountType,
      discountValue: b.discountValue,
      payments,
      services: [],
    });
    return {
      ...b,
      paymentStatus: finance.paymentStatus,
      paidAmount: finance.paidAmount,
      balance: finance.balance,
      convertedBy: leads[0]?.assignedTo?.name ?? leads[0]?.assignedTo?.email ?? null,
    };
  });

  return (
    <BookingsClient
      initialBookings={bookings}
      totalCount={totalCount}
      canDelete={canDelete}
      isAdmin={isAdmin}
      cardStats={cardStats}
    />
  );
}
