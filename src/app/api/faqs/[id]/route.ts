import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { FaqStatus, FaqPlacement } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const idArray = z.array(z.string()).optional();

const patchSchema = z.object({
  question: z.string().min(3).optional(),
  shortAnswer: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  status: z.nativeEnum(FaqStatus).optional(),
  featured: z.boolean().optional(),
  placements: z.array(z.nativeEnum(FaqPlacement)).optional(),
  sortOrder: z.coerce.number().int().optional(),
  lastReviewedAt: z.string().optional().nullable(),
  tourIds: idArray,
  destinationIds: idArray,
  blogIds: idArray,
  campaignIds: idArray,
  activityIds: idArray,
});

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("faqs", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const faq = await prisma.faq.findUnique({
    where: { id },
    include: {
      category: true,
      tours: { select: { id: true, title: true } },
      destinations: { select: { id: true, name: true } },
      blogs: { select: { id: true, title: true } },
      campaigns: { select: { id: true, name: true } },
      activities: { select: { id: true, name: true } },
    },
  });
  if (!faq) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(faq);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("faqs", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.faq.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const {
    tourIds,
    destinationIds,
    blogIds,
    campaignIds,
    activityIds,
    lastReviewedAt,
    question,
    ...rest
  } = parsed.data;

  try {
    // Re-slugging on every question edit would break existing external/
    // internal links to this FAQ's detail page — slug is generated once at
    // creation and left stable afterward, matching how Tour/Blog slugs work
    // (auto-suggested once, then editable independently — here it's simply
    // never auto-regenerated after creation).
    const updated = await prisma.faq.update({
      where: { id },
      data: {
        ...rest,
        ...(question ? { question } : {}),
        ...(lastReviewedAt !== undefined
          ? { lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : null }
          : {}),
        updatedById: guard.user.id,
        ...(tourIds ? { tours: { set: tourIds.map((tid) => ({ id: tid })) } } : {}),
        ...(destinationIds
          ? { destinations: { set: destinationIds.map((did) => ({ id: did })) } }
          : {}),
        ...(blogIds ? { blogs: { set: blogIds.map((bid) => ({ id: bid })) } } : {}),
        ...(campaignIds ? { campaigns: { set: campaignIds.map((cid) => ({ id: cid })) } } : {}),
        ...(activityIds ? { activities: { set: activityIds.map((aid) => ({ id: aid })) } } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002"))
      return NextResponse.json({ error: "A FAQ with this slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("faqs", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.faq.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.faq.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
