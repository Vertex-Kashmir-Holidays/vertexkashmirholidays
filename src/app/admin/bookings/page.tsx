import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { BookingsClient } from "@/components/admin/bookings/BookingsClient";

export const metadata: Metadata = { title: "Bookings — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const session = await auth();
  const role = session?.user?.role;
  const canDelete = !!role && (await can(role, "bookings", "delete"));
  // Cancellation/refund are admin-only business actions (server-enforced too).
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  // Only the first page (matching BookingsClient's default page size) is
  // fetched server-side for a fast initial paint — every subsequent
  // page/search/filter change is handled client-side via /api/bookings,
  // the same already-existing paginated endpoint, instead of the previous
  // approach of loading (and silently capping at) the first 100 rows.
  const [rows, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where: { deletedAt: null },
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
        payments: { select: { amount: true } },
      },
    }),
    prisma.booking.count({ where: { deletedAt: null } }),
  ]);

  // Derive payment status (Pending/Partial/Full) per booking from its ledger so
  // the list shows it alongside the lifecycle status, consistently with the rest
  // of the app. Strip the raw payments array before sending to the client.
  const bookings = rows.map(({ payments, ...b }) => {
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
    };
  });

  return (
    <BookingsClient
      initialBookings={bookings}
      totalCount={totalCount}
      canDelete={canDelete}
      isAdmin={isAdmin}
    />
  );
}
