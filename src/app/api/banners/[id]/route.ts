import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// All fields optional so the admin can toggle `isActive` inline, reorder, or
// edit content — individually or together. An absent key is left untouched; a
// present empty string / null clears the column.
const patchSchema = z.object({
  type: z.enum(["STRIP", "PROMO"]).optional(),
  title: z.string().min(1, "Title is required").max(200).optional(),
  body: z.string().max(2000).nullable().optional(),
  ctaLabel: z.string().max(100).nullable().optional(),
  ctaUrl: z.string().max(2048).nullable().optional(),
  imageUrl: z.string().max(2048).nullable().optional(),
  imageMobileUrl: z.string().max(2048).nullable().optional(),
  pages: z.array(z.string().min(1)).min(1, "Select at least one page").optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

function normalizeText(v: string | null | undefined): string | null {
  return v && v.trim() !== "" ? v.trim() : null;
}

function parseDate(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  if (!v || v.trim() === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("banners", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  const d = parsed.data;
  const data: Prisma.BannerUpdateInput = {};
  if (d.type !== undefined) data.type = d.type;
  if (d.title !== undefined) data.title = d.title;
  if (d.body !== undefined) data.body = normalizeText(d.body);
  if (d.ctaLabel !== undefined) data.ctaLabel = normalizeText(d.ctaLabel);
  if (d.ctaUrl !== undefined) data.ctaUrl = normalizeText(d.ctaUrl);
  if (d.imageUrl !== undefined) data.imageUrl = normalizeText(d.imageUrl);
  if (d.imageMobileUrl !== undefined) data.imageMobileUrl = normalizeText(d.imageMobileUrl);
  if (d.pages !== undefined) data.pages = JSON.stringify(d.pages);
  if (d.isActive !== undefined) data.isActive = d.isActive;
  if (d.sortOrder !== undefined) data.sortOrder = d.sortOrder;

  const startsAt = parseDate(d.startsAt);
  if (startsAt !== undefined) data.startsAt = startsAt;
  const endsAt = parseDate(d.endsAt);
  if (endsAt !== undefined) data.endsAt = endsAt;

  // A STRIP banner never carries images — clear them if the type flips to STRIP.
  const finalType = d.type ?? existing.type;
  if (finalType === "STRIP") {
    data.imageUrl = null;
    data.imageMobileUrl = null;
  }

  const updated = await prisma.banner.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("banners", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
