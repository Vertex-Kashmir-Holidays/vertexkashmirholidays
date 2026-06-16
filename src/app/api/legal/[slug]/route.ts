import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { LEGAL_SLUGS, getLegalDefault } from "@/lib/legal/content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const patchSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

// Upsert a legal page by slug (admin-managed).
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("legal", "edit");
  if (guard instanceof NextResponse) return guard;

  const { slug } = await params;
  if (!LEGAL_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Unknown legal page" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const def = getLegalDefault(slug)!;
  const saved = await prisma.legalPage.upsert({
    where: { slug },
    update: { title: parsed.data.title, content: parsed.data.content },
    create: { slug, title: parsed.data.title || def.title, content: parsed.data.content },
  });
  return NextResponse.json(saved);
}
