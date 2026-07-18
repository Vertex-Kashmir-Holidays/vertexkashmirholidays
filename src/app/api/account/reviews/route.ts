import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { REVIEWABLE_BOOKING_STATUSES } from "@/lib/reviews";
import { z } from "zod";

// Customer self-service review creation. Scoped to the authenticated user; the
// customer may only review a tour they have a completed booking for, and only
// once per tour (enforced by the @@unique([userId, tourId]) constraint).
const schema = z.object({
  tourId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to write a review." }, { status: 401 });
  }
  const userId = session.user.id;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { tourId, rating, body } = parsed.data;

  // Verified purchase: the tour must be published and the customer must have a
  // completed (CONFIRMED/PAID) booking for it.
  const [tour, booking] = await Promise.all([
    prisma.tour.findFirst({ where: { id: tourId, published: true }, select: { id: true } }),
    prisma.booking.findFirst({
      where: {
        userId,
        tourId,
        deletedAt: null,
        status: { in: [...REVIEWABLE_BOOKING_STATUSES] },
      },
      select: { id: true },
    }),
  ]);
  if (!tour) {
    return NextResponse.json({ error: "Tour not found." }, { status: 404 });
  }
  if (!booking) {
    return NextResponse.json(
      { error: "You can only review tours you have travelled on." },
      { status: 403 },
    );
  }

  // Display name from the account, falling back to the email local part.
  const name = session.user.name?.trim() || session.user.email?.split("@")[0] || "Traveller";

  try {
    const review = await prisma.review.create({
      data: { tourId, userId, name, rating, body, approved: false },
    });
    return NextResponse.json(
      { ...review, message: "Review submitted — it will appear after moderation." },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("P2002")) {
      return NextResponse.json(
        { error: "You have already reviewed this tour. Edit your existing review instead." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not submit review." }, { status: 500 });
  }
}
