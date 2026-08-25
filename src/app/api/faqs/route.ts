import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { generateFaqSlug, getPublicFaqIndex } from "@/lib/faqs";
import { parseJsonBody, parseWithSchema, mapPrismaError } from "@/lib/api/route-helpers";
import { z } from "zod";
import { FaqStatus, FaqPlacement } from "@prisma/client";

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
    revalidateTag("faqs", "max");
    return NextResponse.json(faq, { status: 201 });
  } catch (err) {
    return mapPrismaError(err, "A FAQ with this slug already exists", "Create failed");
  }
}

// Public GET — a filtered slice of the categorized index, used by /faq's
// client-side category tabs (SSR handles the initial render; this backs
// client-side re-filtering without a full page navigation). Never exposes
// unpublished FAQs. The query itself is cached (getPublicFaqIndex): this file
// used to carry `export const dynamic = "force-dynamic"` for the admin POST
// above, and because route config is per-file the public read inherited it and
// hit the database on every request.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category") ?? undefined;

  const faqs = await getPublicFaqIndex(categorySlug);

  // Cached at the edge as well as in the Data Cache: the payload is public and
  // identical for every visitor, so under normal traffic the CDN answers most
  // requests without invoking the function at all. The 5-minute window matches
  // the Data Cache TTL and is well inside the staleness /faq itself already
  // accepts (`export const revalidate = 1800`); revalidateTag can't reach a CDN
  // copy, so an admin edit shows up here within that window rather than at once.
  return NextResponse.json(
    { items: faqs },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
