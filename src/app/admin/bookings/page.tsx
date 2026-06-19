import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { BookingsClient } from "@/components/admin/bookings/BookingsClient";

export const metadata: Metadata = { title: "Bookings — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const session = await auth();
  const canDelete = !!session?.user?.role && (await can(session.user.role, "bookings", "delete"));

  const [bookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        tour: { select: { title: true, slug: true, coverImage: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.booking.count({ where: { deletedAt: null } }),
  ]);

  return <BookingsClient initialBookings={bookings} totalCount={totalCount} canDelete={canDelete} />;
}
