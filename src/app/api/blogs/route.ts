import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  coverImage: z.string().optional(),
  coverImageMobile: z.string().optional(),
  author: z.string().optional(),
  authorRole: z.string().optional(),
  authorBio: z.string().optional(),
  authorImage: z.string().optional(),
  category: z.string().optional(),
  readTime: z.coerce.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  relatedTours: z.string().optional(),
  quickAnswer: z.string().optional(),
  published: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const cursor = searchParams.get("cursor") ?? undefined;
  const take = Math.min(parseInt(searchParams.get("take") ?? "9", 10), 24);

  const where = {
    published: true,
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
            { author: { contains: search } },
          ],
        }
      : {}),
  };

  const items = await prisma.blog.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    take: take + 1,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      author: true,
      publishedAt: true,
      body: true,
    },
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({ items: page, nextCursor });
}

export async function POST(request: Request) {
  const guard = await requirePermission("blogs", "create");
  if (guard instanceof NextResponse) return guard;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  try {
    const { published, ...rest } = parsed.data;
    const blog = await prisma.blog.create({
      data: {
        ...rest,
        published: published ?? false,
        ...(published ? { publishedAt: new Date() } : {}),
      },
    });
    return NextResponse.json(blog, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
