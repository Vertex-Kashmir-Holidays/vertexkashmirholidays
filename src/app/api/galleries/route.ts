import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "";
  const type = searchParams.get("type") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const take = 24;
  const skip = (page - 1) * take;

  const where = {
    ...(category ? { category } : {}),
    ...(type === "IMAGE" || type === "VIDEO" ? { type } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.gallery.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take,
      skip,
    }),
    prisma.gallery.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / take) });
}

const createSchema = z.object({
  url: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]).optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  category: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function POST(request: Request) {
  const guard = await requirePermission("galleries", "create");
  if (guard instanceof NextResponse) return guard;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const item = await prisma.gallery.create({ data: parsed.data });
  return NextResponse.json(item, { status: 201 });
}
