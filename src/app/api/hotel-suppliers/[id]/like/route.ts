import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/ratelimit";
import { isSameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// Public, unauthenticated: increments a hotel's aggregate, anonymous
// visitor-interest counter (HotelSupplier.publicLikeCount) from the Trip
// Planner hotel carousel. This is NOT a Lead, NOT tied to any visitor
// identity, and NOT customer preference data — see the field's own doc
// comment in prisma/schema.prisma. Duplicate protection is IP + hotel rate
// limiting (the same existing infra /api/leads and /api/attribution/token
// already use) plus a client-side localStorage check (TripPlannerHotelCard) —
// neither requires login or new infrastructure. The response never returns
// internal data (no count, no admin fields) — just success/failure.
export async function POST(req: NextRequest, { params }: Params) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ip = clientIp(req);
  // One like per hotel per IP per day — generous enough that a shared/NAT'd
  // IP liking several different hotels isn't blocked, but bounds a script or
  // an accidental rapid-repeat click from inflating one hotel's count.
  const limit = await rateLimit(`hotel-like:${ip}:${id}`, 1, "24 h");
  if (!limit.success) {
    return tooManyRequests(limit);
  }

  // showOnWebsite: true guards against liking a hotel that isn't (or is no
  // longer) publicly listed — updateMany returns count: 0 rather than
  // throwing if the id doesn't match, so a stale/forged id is a quiet no-op.
  const result = await prisma.hotelSupplier.updateMany({
    where: { id, showOnWebsite: true },
    data: { publicLikeCount: { increment: 1 } },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidateTag("hotel-supplier-public", "max");
  return NextResponse.json({ success: true });
}
