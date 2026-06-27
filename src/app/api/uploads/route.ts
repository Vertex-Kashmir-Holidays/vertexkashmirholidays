import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Module/category folder this asset belongs to, and optional alt text. Both
  // are optional so older callers that only send `file` keep working.
  const folder = (formData.get("folder") as string | null)?.trim() || "general";
  const alt = (formData.get("alt") as string | null)?.trim() || null;

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Only image or video files are allowed" }, { status: 400 });
  }
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large (max ${isVideo ? "50" : "5"} MB)` },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const type = isVideo ? "VIDEO" : "IMAGE";

  let url: string;
  try {
    ({ url } = await saveUpload(buffer, { folder, ext }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    console.error("[uploads] saveUpload error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Register every upload in the central Gallery so it becomes reusable across
  // any module. Failure to register must not fail the upload — the file is
  // already written and the URL is valid — so we swallow registration errors.
  let galleryId: string | null = null;
  try {
    const item = await prisma.gallery.create({
      data: { url, type, category: folder, alt },
    });
    galleryId = item.id;
  } catch {
    galleryId = null;
  }

  return NextResponse.json({ url, type, id: galleryId }, { status: 201 });
}
