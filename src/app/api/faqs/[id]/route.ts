import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, requireExisting, mapPrismaError } from "@/lib/api/route-helpers";
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
  const faq = await requireExisting(() =>
    prisma.faq.findUnique({
      where: { id },
      include: {
        category: true,
        tours: { select: { id: true, title: true } },
        destinations: { select: { id: true, name: true } },
        blogs: { select: { id: true, title: true } },
        campaigns: { select: { id: true, name: true } },
        activities: { select: { id: true, name: true } },
      },
    }),
  );
  if (!faq.ok) return faq.response;
  return NextResponse.json(faq.data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("faqs", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => prisma.faq.findUnique({ where: { id } }));
  if (!existing.ok) return existing.response;

  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(patchSchema, body.data);
  if (!parsed.ok) return parsed.response;

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
    return mapPrismaError(err, "A FAQ with this slug already exists", "Update failed");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("faqs", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => prisma.faq.findUnique({ where: { id } }));
  if (!existing.ok) return existing.response;
  await prisma.faq.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
