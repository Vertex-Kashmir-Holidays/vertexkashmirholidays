import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
import { recomputeTourRating } from "@/lib/reviews";
import { z } from "zod";

// Admin-only review creation. Customer self-service reviews live under
// /api/account/reviews (auth-scoped, verified-purchase). This endpoint lets
// staff add a review on a customer's behalf; staff-created reviews default to
// approved so they publish immediately.
const schema = z.object({
  tourId: z.string().min(1),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  avatar: z.string().max(2048).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000),
  approved: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const guard = await requirePermission("reviews", "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const tour = await prisma.tour.findUnique({
    where: { id: parsed.data.tourId },
    select: { id: true },
  });
  if (!tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  // Publishing is admin-only: a non-admin staff member's review is forced into
  // the pending queue regardless of the requested `approved` flag.
  const approved = isAdminRole((guard.user as { role?: string }).role)
    ? parsed.data.approved
    : false;

  // Staff-created reviews are not tied to a customer account (userId stays null),
  // so the per-user unique constraint does not apply.
  const review = await prisma.review.create({
    data: {
      tourId: parsed.data.tourId,
      name: parsed.data.name,
      avatar: parsed.data.avatar?.trim() ? parsed.data.avatar.trim() : null,
      rating: parsed.data.rating,
      body: parsed.data.body,
      approved,
    },
  });

  if (review.approved) await recomputeTourRating(parsed.data.tourId);

  return NextResponse.json(review, { status: 201 });
}
