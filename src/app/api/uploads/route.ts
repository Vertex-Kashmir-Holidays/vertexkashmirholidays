import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { saveUpload, isCloudinaryConfigured } from "@/lib/storage";

const MAX_IMAGE_SIZE = 500 * 1024;
const MAX_VIDEO_SIZE = 10 * 1024 * 1024;
const MAX_DOC_SIZE   = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

function checkMagicBytes(buf: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  if (mime === "image/png")  return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  if (mime === "image/webp") {
    return buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
           buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  }
  return true;
}

export async function POST(req: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

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

  const isImage    = ALLOWED_IMAGE_TYPES.has(file.type);
  const isVideo    = file.type.startsWith("video/");
  const isDocument = DOCUMENT_TYPES.has(file.type);

  if (!isImage && !isVideo && !isDocument) {
    return NextResponse.json(
      { error: "Images must be JPG, PNG, or WebP. Videos and documents are also accepted." },
      { status: 400 },
    );
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : isDocument ? MAX_DOC_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large (max ${isVideo ? "10 MB" : isDocument ? "5 MB" : "500 KB"})` },
      { status: 400 },
    );
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (isImage && !checkMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: "File content does not match the declared image type." },
      { status: 400 },
    );
  }

  const ext  = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const type = isVideo ? "VIDEO" : "IMAGE";

  let url: string;
  let publicId: string | null = null;
  try {
    ({ url, publicId } = await saveUpload(buffer, { folder, ext, isImage }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    console.error("[uploads] saveUpload error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  let galleryId: string | null = null;
  try {
    const item = await prisma.gallery.create({
      data: { url, publicId: publicId ?? null, type, category: folder, alt },
    });
    galleryId = item.id;
  } catch {
    galleryId = null;
  }

  return NextResponse.json({ url, type, id: galleryId, publicId }, { status: 201 });
}
