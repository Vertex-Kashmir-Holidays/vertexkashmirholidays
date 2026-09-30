import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, mapPrismaError } from "@/lib/api/route-helpers";
import { invalidateTourCollection } from "@/lib/cache";
import { collectionSlugField } from "@/lib/tours/collections";

export const dynamic = "force-dynamic";

// Tour Collections are tour merchandising, so they sit under the existing
// "packages" RBAC module rather than a new one (no new RolePermission rows).

const createSchema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: collectionSlugField,
  intro: z.string().optional(),
  content: z.string().optional(),
  heroImage: z.string().optional(),
  heroImageMobile: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
  published: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function POST(request: Request) {
  const guard = await requirePermission("packages", "create");
  if (guard instanceof NextResponse) return guard;
  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(createSchema, body.data);
  if (!parsed.ok) return parsed.response;
  try {
    const collection = await prisma.tourCollection.create({ data: parsed.data });
    // A brand-new collection has no tours assigned yet (assignment happens
    // on the Tour form), so only its own page/sitemap/tours row are affected.
    invalidateTourCollection({ slug: collection.slug });
    return NextResponse.json(collection, { status: 201 });
  } catch (err) {
    return mapPrismaError(err, "Slug already exists", "Create failed");
  }
}
