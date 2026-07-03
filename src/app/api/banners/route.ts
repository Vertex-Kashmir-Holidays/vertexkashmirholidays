import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// Empty-string / null date inputs become null; otherwise parse to a Date and
// reject invalid values.
const dateField = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v && v.trim() !== "" ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), { message: "Invalid date" });

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null));

export const bannerSchema = z.object({
  type: z.enum(["STRIP", "PROMO"]).default("STRIP"),
  title: z.string().min(1, "Title is required").max(200),
  body: optionalText,
  ctaLabel: optionalText,
  ctaUrl: optionalText,
  imageUrl: optionalText,
  imageMobileUrl: optionalText,
  pages: z.array(z.string().min(1)).min(1, "Select at least one page").default(["*"]),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  startsAt: dateField,
  endsAt: dateField,
});

export async function GET() {
  const guard = await requirePermission("banners", "view");
  if (guard instanceof NextResponse) return guard;

  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(banners);
}

export async function POST(request: Request) {
  const guard = await requirePermission("banners", "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const d = parsed.data;
  const banner = await prisma.banner.create({
    data: {
      type: d.type,
      title: d.title,
      body: d.body,
      ctaLabel: d.ctaLabel,
      ctaUrl: d.ctaUrl,
      // Images only apply to PROMO banners.
      imageUrl: d.type === "PROMO" ? d.imageUrl : null,
      imageMobileUrl: d.type === "PROMO" ? d.imageMobileUrl : null,
      pages: JSON.stringify(d.pages),
      isActive: d.isActive,
      sortOrder: d.sortOrder,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
    },
  });

  return NextResponse.json(banner, { status: 201 });
}
