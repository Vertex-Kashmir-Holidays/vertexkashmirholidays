import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { TourCategory } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  category: z.enum(["HONEYMOON", "FAMILY", "ADVENTURE", "LUXURY"]).optional(),
  duration: z.coerce.number().int().min(1).optional(),
  excerpt: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  gallery: z.string().optional(),
  itinerary: z.string().optional(),
  inclusions: z.string().optional(),
  exclusions: z.string().optional(),
  priceFrom: z.coerce.number().positive().optional(),
  priceWas: z.coerce.number().positive().optional().nullable(),
  discountPct: z.coerce.number().int().min(0).max(100).optional().nullable(),
  bestseller: z.boolean().optional(),
  published: z.boolean().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tour = await prisma.tour.findUnique({ where: { id } });
  if (!tour) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tour);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.tour.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { category, ...rest } = parsed.data;
  try {
    const updated = await prisma.tour.update({
      where: { id },
      data: {
        ...rest,
        ...(category ? { category: category as TourCategory } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.tour.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.tour.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
