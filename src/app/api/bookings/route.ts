import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const;

export async function GET(req: NextRequest) {
  const guard = await requirePermission("bookings", "view");
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status") ?? "";
  const search = searchParams.get("search")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
  const skip = (page - 1) * take;

  const status: BookingStatus | undefined = VALID_STATUSES.includes(rawStatus as BookingStatus)
    ? (rawStatus as BookingStatus)
    : undefined;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { guestName: { contains: search } },
            { guestEmail: { contains: search } },
            { guestPhone: { contains: search } },
            { razorpayOrderId: { contains: search } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
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
    prisma.booking.count({ where }),
  ]);

  // Derive payment status (Pending/Partial/Full) per booking from its ledger —
  // same helper and shape admin/bookings/page.tsx used before this route took
  // over as BookingsClient's data source. Strip the raw payments array before
  // sending to the client.
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

  return NextResponse.json({ bookings, total, page, pages: Math.ceil(total / take) });
}
