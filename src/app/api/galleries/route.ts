import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const take = 24;
  const skip = (page - 1) * take;

  const where = category ? { category } : {};
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
  alt: z.string().optional(),
  caption: z.string().optional(),
  category: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const item = await prisma.gallery.create({ data: parsed.data });
  return NextResponse.json(item, { status: 201 });
}
