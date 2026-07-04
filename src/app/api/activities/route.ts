import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Blank string → null for the optional numeric price.
const priceField = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v) : v),
  z.number().min(0).nullable(),
);

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  coverImageMobile: z.string().optional(),
  images: z.string().optional(), // JSON string array
  location: z.string().optional(),
  icon: z.string().optional(),
  duration: z.string().optional(),
  price: priceField.optional(),
  published: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
  destinationIds: z.array(z.string()).optional(),
  tourIds: z.array(z.string()).optional(),
});

export async function GET() {
  const guard = await requirePermission("activities", "view");
  if (guard instanceof NextResponse) return guard;

  const activities = await prisma.activity.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      coverImage: true,
      location: true,
      duration: true,
      price: true,
      published: true,
      _count: { select: { destinations: true, tours: true } },
    },
  });
  return NextResponse.json(activities);
}

export async function POST(request: Request) {
  const guard = await requirePermission("activities", "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { destinationIds = [], tourIds = [], ...data } = parsed.data;

  try {
    const activity = await prisma.activity.create({
      data: {
        ...data,
        destinations: { create: destinationIds.map((destinationId) => ({ destinationId })) },
        tours: { create: tourIds.map((tourId) => ({ tourId })) },
      },
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
