import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requirePermission("dashboard", "view");
  if (guard instanceof NextResponse) return guard;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    revenueAgg,
    thisMonthRevAgg,
    lastMonthRevAgg,
    totalBookings,
    thisMonthBookings,
    lastMonthBookings,
    totalLeads,
    thisMonthLeads,
    lastMonthLeads,
    paidCount,
    recentBookings,
    recentLeads,
    pendingReviews,
    allPaidBookings,
  ] = await Promise.all([
    prisma.booking.aggregate({ where: { status: BookingStatus.PAID }, _sum: { amount: true } }),
    prisma.booking.aggregate({ where: { status: BookingStatus.PAID, createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.booking.aggregate({ where: { status: BookingStatus.PAID, createdAt: { gte: startOfLastMonth, lt: startOfMonth } }, _sum: { amount: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.booking.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.lead.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    prisma.booking.count({ where: { status: BookingStatus.PAID } }),
    prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { tour: { select: { title: true, coverImage: true, slug: true } } },
    }),
    prisma.lead.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
    prisma.review.count({ where: { approved: false } }),
    prisma.booking.findMany({
      where: { status: BookingStatus.PAID },
      select: { amount: true, createdAt: true, tourId: true },
    }),
  ]);

  // Revenue by month — last 6 months
  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleString("en-IN", { month: "short" }) + " '" + String(d.getFullYear()).slice(2);
    const revenue = allPaidBookings
      .filter((b) => b.createdAt >= d && b.createdAt < nextMonth)
      .reduce((s, b) => s + b.amount, 0);
    return { month: label, revenue };
  });

  // Top tours by revenue
  const tourRevMap: Record<string, { revenue: number; count: number }> = {};
  for (const b of allPaidBookings) {
    const e = tourRevMap[b.tourId] ?? { revenue: 0, count: 0 };
    e.revenue += b.amount;
    e.count += 1;
    tourRevMap[b.tourId] = e;
  }
  const topTourIds = Object.entries(tourRevMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id]) => id);

  const topTourDetails = topTourIds.length
    ? await prisma.tour.findMany({
        where: { id: { in: topTourIds } },
        select: { id: true, title: true, slug: true, coverImage: true, rating: true, reviewCount: true },
      })
    : [];

  const topTours = topTourIds.map((id) => {
    const detail = topTourDetails.find((d) => d.id === id);
    const stats = tourRevMap[id]!;
    return { ...detail, bookingCount: stats.count, revenue: stats.revenue };
  });

  const totalRevenue = revenueAgg._sum.amount ?? 0;
  const conversionRate =
    totalLeads > 0 ? Math.round((paidCount / totalLeads) * 1000) / 10 : 0;
  const avgBooking = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

  return NextResponse.json({
    revenue: {
      total: totalRevenue,
      thisMonth: thisMonthRevAgg._sum.amount ?? 0,
      lastMonth: lastMonthRevAgg._sum.amount ?? 0,
    },
    bookings: { total: totalBookings, thisMonth: thisMonthBookings, lastMonth: lastMonthBookings },
    leads: { total: totalLeads, thisMonth: thisMonthLeads, lastMonth: lastMonthLeads },
    paidCount,
    conversionRate,
    avgBooking,
    revenueByMonth,
    recentBookings,
    recentLeads,
    topTours,
    pendingReviews,
  });
}
