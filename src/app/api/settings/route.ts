import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  siteName: z.string().min(1).optional(),
  siteTagline: z.string().optional().nullable(),
  siteEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  sitePhone: z.string().optional().nullable(),
  siteAddress: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  googleReviews: z.string().optional().nullable(),
  tripadvisor: z.string().optional().nullable(),
  googleBusinessProfile: z.string().optional().nullable(),
  googlePlaceId: z.string().optional().nullable(),
  tripadvisorHeroWidgetEmbed: z.string().optional().nullable(),
  tripadvisorRatingWidgetEmbed: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  // Configurable GST percentage options (stored as a JSON number array string).
  gstRates: z.array(z.coerce.number().positive().max(100)).optional(),
  showAnnouncementBanner: z.boolean().optional(),
  announcementMessage: z.string().optional().nullable(),
  // Legal/business identity
  legalName: z.string().optional().nullable(),
  tourismRegNumber: z.string().optional().nullable(),
  tourismRegAuthority: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressState: z.string().optional().nullable(),
  addressPincode: z.string().optional().nullable(),
  addressCountry: z.string().optional().nullable(),
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
  // gstRates is stored as a JSON string column; serialise it before persisting.
  const { gstRates, ...rest } = parsed.data;
  const data = { ...rest, ...(gstRates !== undefined ? { gstRates: JSON.stringify(gstRates) } : {}) };
  const updated = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  revalidateTag("site-settings", "max");
  return NextResponse.json(updated);
}
