import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { generateFaqSlug } from "@/lib/faqs";
import { parseJsonBody, parseWithSchema, mapPrismaError } from "@/lib/api/route-helpers";
import { z } from "zod";
import { FaqStatus, FaqPlacement } from "@prisma/client";

export const dynamic = "force-dynamic";

const idArray = z.array(z.string()).default([]);

const createSchema = z.object({
  question: z.string().min(3),
  shortAnswer: z.string().min(1),
  answer: z.string().min(1),
  categoryId: z.string().min(1),
  status: z.nativeEnum(FaqStatus).optional(),
  featured: z.boolean().optional(),
  placements: z.array(z.nativeEnum(FaqPlacement)).default([]),
  sortOrder: z.coerce.number().int().optional(),
  lastReviewedAt: z.string().optional().nullable(),
  tourIds: idArray,
  destinationIds: idArray,
  blogIds: idArray,
  campaignIds: idArray,
  activityIds: idArray,
});

export async function POST(request: Request) {
  const guard = await requirePermission("faqs", "create");
  if (guard instanceof NextResponse) return guard;

  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(createSchema, body.data);
  if (!parsed.ok) return parsed.response;

  const { tourIds, destinationIds, blogIds, campaignIds, activityIds, lastReviewedAt, ...rest } =
    parsed.data;

  try {
    const slug = await generateFaqSlug(rest.question);
    const faq = await prisma.faq.create({
      data: {
        ...rest,
        slug,
        lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : null,
        createdById: guard.user.id,
        updatedById: guard.user.id,
        tours: { connect: tourIds.map((id) => ({ id })) },
        destinations: { connect: destinationIds.map((id) => ({ id })) },
        blogs: { connect: blogIds.map((id) => ({ id })) },
        campaigns: { connect: campaignIds.map((id) => ({ id })) },
        activities: { connect: activityIds.map((id) => ({ id })) },
      },
    });
    return NextResponse.json(faq, { status: 201 });
  } catch (err) {
    return mapPrismaError(err, "A FAQ with this slug already exists", "Create failed");
  }
}

// Public GET — a filtered slice of the categorized index, used by /faq's
// client-side category tabs (SSR handles the initial render; this backs
// client-side re-filtering without a full page navigation). Never exposes
// unpublished FAQs.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category") ?? undefined;

  const faqs = await prisma.faq.findMany({
    where: {
      status: "PUBLISHED",
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    select: {
      id: true,
      question: true,
      shortAnswer: true,
      slug: true,
      category: { select: { name: true, slug: true } },
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({ items: faqs });
}
