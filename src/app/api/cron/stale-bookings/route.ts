import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanupStalePendingBookings, STALE_BOOKING_MINUTES } from "@/lib/bookings/cleanup";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// Not currently scheduled — Vercel Hobby doesn't support the frequency this
// sweep needs (see offline-conversions/route.ts, same constraint), so its
// entry is not in vercel.json. The primary trigger is the inline call in
// create-order/route.ts on real traffic; this is a manual/backup sweep.

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const before = await prisma.booking.count({
    where: {
      status: "PENDING",
      deletedAt: null,
      createdAt: { lt: new Date(Date.now() - STALE_BOOKING_MINUTES * 60 * 1000) },
      payments: { none: {} },
    },
  });

  await cleanupStalePendingBookings();

  return NextResponse.json({ ok: true, bookingsCancelled: before });
}
