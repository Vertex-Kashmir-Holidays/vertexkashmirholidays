import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  coverImageMobile: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  published: z.boolean().optional(),
  publishedAt: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("blogs", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(blog);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("blogs", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const { publishedAt, published, ...rest } = parsed.data;
  try {
    const updated = await prisma.blog.update({
      where: { id },
      data: {
        ...rest,
        ...(published !== undefined ? { published } : {}),
        ...(publishedAt !== undefined
          ? { publishedAt: publishedAt ? new Date(publishedAt) : null }
          : published === true && !existing.publishedAt
          ? { publishedAt: new Date() }
          : {}),
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
  const guard = await requirePermission("blogs", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.blog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
