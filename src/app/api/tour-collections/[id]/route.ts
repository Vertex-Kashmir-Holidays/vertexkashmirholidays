import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import {
  parseJsonBody,
  parseWithSchema,
  requireExisting,
  mapPrismaError,
} from "@/lib/api/route-helpers";
import { invalidateTourCollection } from "@/lib/cache";
import { collectionSlugField } from "@/lib/tours/collections";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  slug: collectionSlugField.optional(),
  intro: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  heroImage: z.string().optional().nullable(),
  heroImageMobile: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  published: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

const findWithTours = (id: string) =>
  prisma.tourCollection.findUnique({
    where: { id },
    include: { tours: { select: { slug: true } } },
  });

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("packages", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => findWithTours(id));
  if (!existing.ok) return existing.response;
  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(patchSchema, body.data);
  if (!parsed.ok) return parsed.response;
  try {
    const updated = await prisma.tourCollection.update({ where: { id }, data: parsed.data });
    invalidateTourCollection({
      slug: updated.slug,
      previousSlug: existing.data.slug,
      tourSlugs: existing.data.tours.map((t) => t.slug),
    });
    return NextResponse.json(updated);
  } catch (err) {
    return mapPrismaError(err, "Slug already exists", "Update failed");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("packages", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => findWithTours(id));
  if (!existing.ok) return existing.response;
  // Implicit m2m join rows (tours, FAQs) cascade; the Tours themselves are untouched.
  await prisma.tourCollection.delete({ where: { id } });
  invalidateTourCollection({
    slug: existing.data.slug,
    tourSlugs: existing.data.tours.map((t) => t.slug),
  });
  return NextResponse.json({ success: true });
}
