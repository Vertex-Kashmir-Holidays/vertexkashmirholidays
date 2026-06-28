import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { saveUpload, isCloudinaryConfigured } from "@/lib/storage";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50 MB
const MAX_DOC_SIZE   = 5 * 1024 * 1024;   // 5 MB

const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export async function POST(req: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  // On Vercel the filesystem is read-only — Cloudinary must be configured.
  if (typeof window === "undefined" && process.env.VERCEL && !isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "File storage is not configured on this server." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const folder = (formData.get("folder") as string | null)?.trim() || "general";
  const alt    = (formData.get("alt") as string | null)?.trim() || null;

  const isImage    = file.type.startsWith("image/");
  const isVideo    = file.type.startsWith("video/");
  const isDocument = DOCUMENT_TYPES.has(file.type);

  if (!isImage && !isVideo && !isDocument) {
    return NextResponse.json(
      { error: "Only image, video, or document files are allowed" },
      { status: 400 },
    );
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : isDocument ? MAX_DOC_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large (max ${isVideo ? "50" : "5"} MB)` },
      { status: 400 },
    );
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext    = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const type   = isVideo ? "VIDEO" : "IMAGE"; // Gallery only tracks image/video

  let url: string;
  let publicId: string | null = null;
  try {
    ({ url, publicId } = await saveUpload(buffer, { folder, ext }));
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

  return NextResponse.json({ url, type, id: galleryId, publicId }, { status: 201 });
}
