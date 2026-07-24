import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { EmploymentType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  department: z.string().min(1).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  experience: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  salary: z.string().optional().nullable(),
  shortDescription: z.string().min(1).optional(),
  aboutRole: z.string().min(1).optional(),
  responsibilities: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("careers", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("careers", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const { responsibilities, requirements, preferredSkills, benefits, published, ...rest } =
    parsed.data;

  try {
    const updated = await prisma.job.update({
      where: { id },
      data: {
        ...rest,
        ...(responsibilities !== undefined
          ? { responsibilities: JSON.stringify(responsibilities) }
          : {}),
        ...(requirements !== undefined ? { requirements: JSON.stringify(requirements) } : {}),
        ...(preferredSkills !== undefined
          ? { preferredSkills: JSON.stringify(preferredSkills) }
          : {}),
        ...(benefits !== undefined ? { benefits: JSON.stringify(benefits) } : {}),
        ...(published !== undefined ? { published } : {}),
        // Stamp publishedAt once, the first time a job goes live — mirrors
        // Blog's PATCH route exactly, so re-publishing doesn't reset "Posted Date".
        ...(published === true && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002"))
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("careers", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
