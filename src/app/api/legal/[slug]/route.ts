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
  // Banner image URLs from the gallery. Empty string clears back to the
  // shipped default; omitted leaves the stored value untouched.
  heroImage: z.string().optional(),
  heroImageMobile: z.string().optional(),
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
  // Normalise blank strings to null so the public page falls back to the
  // shipped default banner rather than rendering an empty <img>.
  const heroImage =
    parsed.data.heroImage !== undefined ? parsed.data.heroImage.trim() || null : undefined;
  const heroImageMobile =
    parsed.data.heroImageMobile !== undefined
      ? parsed.data.heroImageMobile.trim() || null
      : undefined;

  const saved = await prisma.legalPage.upsert({
    where: { slug },
    update: {
      title: parsed.data.title,
      content: parsed.data.content,
      ...(heroImage !== undefined ? { heroImage } : {}),
      ...(heroImageMobile !== undefined ? { heroImageMobile } : {}),
    },
    create: {
      slug,
      title: parsed.data.title || def.title,
      content: parsed.data.content,
      heroImage: heroImage ?? null,
      heroImageMobile: heroImageMobile ?? null,
    },
  });
  return NextResponse.json(saved);
}
