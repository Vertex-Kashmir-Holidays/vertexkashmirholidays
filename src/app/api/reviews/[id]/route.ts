import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
import { recomputeTourRating } from "@/lib/reviews";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// All fields optional so the admin can toggle approval alone, edit content
// alone, or both at once.
const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  // Empty string clears the per-review picture (falls back to the user's image).
  avatar: z.string().max(2048).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  body: z.string().min(10).max(2000).optional(),
  approved: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("reviews", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.review.findUnique({
    where: { id },
    include: { tour: { select: { id: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // Approving/rejecting (publishing) a review is an admin-only action. Other
  // staff with reviews "edit" permission may still correct content, but cannot
  // change a review's published state.
  const approvalChange = parsed.data.approved !== undefined && parsed.data.approved !== existing.approved;
  if (approvalChange && !isAdminRole((guard.user as { role?: string }).role)) {
    return NextResponse.json(
      { error: "Only an admin can approve or reject reviews." },
      { status: 403 },
    );
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.avatar !== undefined ? { avatar: parsed.data.avatar.trim() === "" ? null : parsed.data.avatar.trim() } : {}),
      ...(parsed.data.rating !== undefined ? { rating: parsed.data.rating } : {}),
      ...(parsed.data.body !== undefined ? { body: parsed.data.body } : {}),
      ...(parsed.data.approved !== undefined ? { approved: parsed.data.approved } : {}),
    },
  });

  // Any change to approval state or to an approved review's rating shifts the
  // tour's aggregate, so recompute when the approved set or its values changed.
  const approvalChanged = parsed.data.approved !== undefined && parsed.data.approved !== existing.approved;
  const approvedRatingChanged =
    parsed.data.rating !== undefined && updated.approved && parsed.data.rating !== existing.rating;
  if (approvalChanged || approvedRatingChanged) {
    await recomputeTourRating(existing.tour.id);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("reviews", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.review.findUnique({
    where: { id },
    include: { tour: { select: { id: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.review.delete({ where: { id } });
  await recomputeTourRating(existing.tour.id);
  return NextResponse.json({ success: true });
}
