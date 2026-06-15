import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  siteName: z.string().min(1).optional(),
  siteTagline: z.string().optional().nullable(),
  siteEmail: z.string().email().optional().nullable(),
  sitePhone: z.string().optional().nullable(),
  siteAddress: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
});

export async function GET() {
  const guard = await requirePermission("settings", "view");
  if (guard instanceof NextResponse) return guard;
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const guard = await requirePermission("settings", "edit");
  if (guard instanceof NextResponse) return guard;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const updated = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json(updated);
}
