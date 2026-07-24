import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { listJsonRecords, deleteFromCloudinary } from "@/lib/storage";
import { applicationsFolder, type CareersApplicationRecord } from "@/lib/careers/applications";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// Lists a job's applications. There is no database table for these — each
// application is a small JSON record (see src/app/api/careers/apply/route.ts)
// stored alongside the candidate's resume in Cloudinary, keeping zero
// candidate PII in the database. Volume per job is small (occasional
// hiring), so this reads and returns the full list — pagination is handled
// client-side in the admin UI.
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("careers", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const job = await prisma.job.findUnique({ where: { id }, select: { id: true } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const records = await listJsonRecords<CareersApplicationRecord>(applicationsFolder(id));
  const applications = records
    .map((r) => ({ publicId: r.publicId, ...r.data }))
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  return NextResponse.json({ applications });
}

const deleteSchema = z.object({
  publicId: z.string().min(1),
  resumePublicId: z.string().nullable().optional(),
});

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("careers", "delete");
  if (guard instanceof NextResponse) return guard;
  await params; // job id isn't needed beyond the route shape — publicId is already scoped

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const ids = [parsed.data.publicId, parsed.data.resumePublicId].filter(
    (v): v is string => !!v,
  );
  await deleteFromCloudinary(ids);

  return NextResponse.json({ success: true });
}
