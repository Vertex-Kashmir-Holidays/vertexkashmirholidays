import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BookingsClient } from "@/components/admin/bookings/BookingsClient";

export const metadata: Metadata = { title: "Bookings — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const [bookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        tour: { select: { title: true, slug: true, coverImage: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.booking.count(),
  ]);

  return <BookingsClient initialBookings={bookings} totalCount={totalCount} />;
}
