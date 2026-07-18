import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recomputeTourRating } from "@/lib/reviews";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000).optional(),
});

// Load a review and confirm it belongs to the authenticated customer. Returns
// the review (with tourId) or a NextResponse to return early.
async function ownReviewOr(
  id: string,
): Promise<{ id: string; tourId: string; approved: boolean; rating: number } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, tourId: true, userId: true, approved: true, rating: true },
  });
  // Don't reveal whether the id exists for someone else's review.
  if (!review || review.userId !== session.user.id) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
  return { id: review.id, tourId: review.tourId, approved: review.approved, rating: review.rating };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownReviewOr(id);
  if (owned instanceof NextResponse) return owned;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // Editing content re-opens moderation: the edited review must be re-approved
  // before it shows publicly again.
  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...(parsed.data.rating !== undefined ? { rating: parsed.data.rating } : {}),
      ...(parsed.data.body !== undefined ? { body: parsed.data.body } : {}),
      approved: false,
    },
  });

  // If it had been approved, removing it from the approved set changes the
  // tour aggregate.
  if (owned.approved) await recomputeTourRating(owned.tourId);

  return NextResponse.json({
    ...updated,
    message: "Review updated — it will reappear after moderation.",
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const owned = await ownReviewOr(id);
  if (owned instanceof NextResponse) return owned;

  await prisma.review.delete({ where: { id } });
  if (owned.approved) await recomputeTourRating(owned.tourId);

  return NextResponse.json({ success: true });
}
