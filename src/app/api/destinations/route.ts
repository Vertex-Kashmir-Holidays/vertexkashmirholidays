import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  location: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
});

export async function GET() {
  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    include: {
      tours: {
        where: { tour: { published: true } },
        select: { id: true },
      },
    },
  });

  const result = destinations.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    excerpt: d.excerpt,
    coverImage: d.coverImage,
    location: d.location,
    tourCount: d.tours.length,
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const guard = await requirePermission("destinations", "create");
  if (guard instanceof NextResponse) return guard;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  try {
    const dest = await prisma.destination.create({ data: parsed.data });
    return NextResponse.json(dest, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
