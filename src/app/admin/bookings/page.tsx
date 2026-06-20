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

  const [rows, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
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
    return { ...b, paymentStatus: finance.paymentStatus, paidAmount: finance.paidAmount, balance: finance.balance };
  });

  return <BookingsClient initialBookings={bookings} totalCount={totalCount} canDelete={canDelete} isAdmin={isAdmin} />;
}
