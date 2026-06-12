import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status") ?? "";
  const search = searchParams.get("search")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const take = 20;
  const skip = (page - 1) * take;

  const status: BookingStatus | undefined = VALID_STATUSES.includes(rawStatus as BookingStatus)
    ? (rawStatus as BookingStatus)
    : undefined;

  const where = {
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

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        tour: { select: { title: true, slug: true, coverImage: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({ bookings, total, page, pages: Math.ceil(total / take) });
}
