import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") return null;
  return session;
}

const patchSchema = z.object({
  approved: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id }, include: { tour: { select: { id: true } } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const wasApproved = existing.approved;
  const nowApproved = parsed.data.approved;
  const updated = await prisma.review.update({ where: { id }, data: { approved: nowApproved } });

  // Recompute tour rating + reviewCount
  if (wasApproved !== nowApproved) {
    const approved = await prisma.review.findMany({
      where: { tourId: existing.tour.id, approved: true },
      select: { rating: true },
    });
    const count = approved.length;
    const avg = count > 0 ? approved.reduce((s, r) => s + r.rating, 0) / count : 0;
    await prisma.tour.update({
      where: { id: existing.tour.id },
      data: { rating: Math.round(avg * 10) / 10, reviewCount: count },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id }, include: { tour: { select: { id: true } } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.review.delete({ where: { id } });

  // Recompute tour rating + reviewCount after deletion
  const approved = await prisma.review.findMany({
    where: { tourId: existing.tour.id, approved: true },
    select: { rating: true },
  });
  const count = approved.length;
  const avg = count > 0 ? approved.reduce((s, r) => s + r.rating, 0) / count : 0;
  await prisma.tour.update({
    where: { id: existing.tour.id },
    data: { rating: Math.round(avg * 10) / 10, reviewCount: count },
  });

  return NextResponse.json({ success: true });
}
