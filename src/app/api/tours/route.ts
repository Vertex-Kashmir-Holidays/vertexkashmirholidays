import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { TourCategory } from "@prisma/client";

const PAGE_SIZE = 8;
const VALID_CATEGORIES = ["HONEYMOON", "FAMILY", "ADVENTURE", "LUXURY"] as const;

type SortKey = "popular" | "price_asc" | "price_desc" | "newest";

function getOrderBy(sort: SortKey) {
  switch (sort) {
    case "price_asc":
      return [{ priceFrom: "asc" as const }, { id: "asc" as const }];
    case "price_desc":
      return [{ priceFrom: "desc" as const }, { id: "asc" as const }];
    case "newest":
      return [{ createdAt: "desc" as const }, { id: "asc" as const }];
    default:
      return [{ rating: "desc" as const }, { id: "asc" as const }];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const rawCategory = searchParams.get("category") ?? "";
  const rawSort = searchParams.get("sort") ?? "popular";
  const rawMin = searchParams.get("minDuration");
  const rawMax = searchParams.get("maxDuration");
  const cursor = searchParams.get("cursor") ?? "";
  const take = Math.min(parseInt(searchParams.get("take") ?? String(PAGE_SIZE)), 24);

  const category: TourCategory | undefined =
    VALID_CATEGORIES.includes(rawCategory as (typeof VALID_CATEGORIES)[number])
      ? (rawCategory as TourCategory)
      : undefined;

  const VALID_SORTS: SortKey[] = ["popular", "price_asc", "price_desc", "newest"];
  const sort: SortKey = VALID_SORTS.includes(rawSort as SortKey) ? (rawSort as SortKey) : "popular";
  const minDuration = rawMin ? parseInt(rawMin) : undefined;
  const maxDuration = rawMax ? parseInt(rawMax) : undefined;

  const durationFilter =
    minDuration !== undefined || maxDuration !== undefined
      ? {
          duration: {
            ...(minDuration !== undefined && { gte: minDuration }),
            ...(maxDuration !== undefined && { lte: maxDuration }),
          },
        }
      : {};

  const where = {
    published: true,
    ...(search && { title: { contains: search } }),
    ...(category && { category }),
    ...durationFilter,
  };

  const items = await prisma.tour.findMany({
    where,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: getOrderBy(sort),
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      duration: true,
      coverImage: true,
      priceFrom: true,
      priceWas: true,
      discountPct: true,
      bestseller: true,
      rating: true,
      reviewCount: true,
    },
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({ items: page, nextCursor, total: page.length });
}

// ── Admin-only tour creation ───────────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  category: z.enum(["HONEYMOON", "FAMILY", "ADVENTURE", "LUXURY"]),
  duration: z.coerce.number().int().min(1),
  excerpt: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  priceFrom: z.coerce.number().positive(),
  priceWas: z.coerce.number().positive().optional().nullable(),
  discountPct: z.coerce.number().int().min(0).max(100).optional().nullable(),
  bestseller: z.boolean().optional(),
  published: z.boolean().optional(),
  activityIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const guard = await requirePermission("packages", "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { category, activityIds = [], ...rest } = parsed.data;
  try {
    const tour = await prisma.tour.create({
      data: {
        ...rest,
        category: category as TourCategory,
        activities: { create: activityIds.map((activityId) => ({ activityId })) },
      },
    });
    return NextResponse.json(tour, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Create failed";
    // P2002 = unique constraint violation (duplicate slug)
    if (msg.includes("P2002")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
