import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { EmploymentType } from "@prisma/client";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  department: z.string().min(1),
  employmentType: z.nativeEnum(EmploymentType),
  experience: z.string().min(1),
  location: z.string().min(1),
  salary: z.string().optional(),
  shortDescription: z.string().min(1),
  aboutRole: z.string().min(1),
  responsibilities: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
});

// Admin-only collection read — the public listing page queries Prisma
// directly (published: true), same as Blog/Tour's public pages do.
export async function GET() {
  const guard = await requirePermission("careers", "view");
  if (guard instanceof NextResponse) return guard;

  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      department: true,
      employmentType: true,
      location: true,
      published: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  const guard = await requirePermission("careers", "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const {
    responsibilities = [],
    requirements = [],
    preferredSkills = [],
    benefits = [],
    ...data
  } = parsed.data;

  try {
    const job = await prisma.job.create({
      data: {
        ...data,
        responsibilities: JSON.stringify(responsibilities),
        requirements: JSON.stringify(requirements),
        preferredSkills: JSON.stringify(preferredSkills),
        benefits: JSON.stringify(benefits),
      },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002"))
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
