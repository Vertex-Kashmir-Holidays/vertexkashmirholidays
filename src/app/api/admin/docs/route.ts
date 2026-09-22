import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { saveUpload } from "@/lib/storage";
import { DOC_CATEGORIES, isDocCategory, DOC_EXT_BY_MIME } from "@/lib/docs/categories";

export const dynamic = "force-dynamic";

// Matches the Careers résumé-upload precedent (src/app/api/careers/apply/route.ts):
// one shared byte cap + MIME allowlist, checked here authoritatively (the
// client also checks for UX, but this is the source of truth).
const MAX_DOC_BYTES = 1 * 1024 * 1024; // 1 MB
const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
]);
export async function GET() {
  const guard = await requirePermission("docs", "view");
  if (guard instanceof NextResponse) return guard;

  const docs = await prisma.adminDocument.findMany({
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("docs", "create");
  if (guard instanceof NextResponse) return guard;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const title = formData.get("title");
  const category = formData.get("category");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Please choose a file to upload." }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!isDocCategory(category)) {
    return NextResponse.json(
      { error: `Category must be one of: ${DOC_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!ALLOWED_DOC_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "File must be a PDF, DOC, DOCX, PNG, or JPG." },
      { status: 400 },
    );
  }
  if (file.size > MAX_DOC_BYTES) {
    return NextResponse.json({ error: "File is too large — maximum size is 1 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = DOC_EXT_BY_MIME[file.type];

  let url: string;
  let publicId: string | null;
  try {
    // resourceType: "raw" — see storage.ts / careers/apply for why "auto"
    // (which stores PDFs under resource_type "image") gets blocked by
    // Cloudinary's PDF/ZIP delivery-security setting; "raw" serves as-is.
    ({ url, publicId } = await saveUpload(buffer, {
      folder: "docs",
      ext,
      isImage: false,
      resourceType: "raw",
    }));
  } catch (err) {
    console.error("[admin/docs] upload failed:", err);
    return NextResponse.json({ error: "Could not upload the file. Please try again." }, {
      status: 500,
    });
  }

  const created = await prisma.adminDocument.create({
    data: {
      title: title.trim(),
      category,
      url,
      publicId,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedById: guard.user.id as string,
      uploadedByName: (guard.user.name ?? guard.user.email) as string,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
