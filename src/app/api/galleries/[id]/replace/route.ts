import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { replaceUpload } from "@/lib/storage";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, checkMagicBytes } from "@/lib/uploads/imageValidation";

type Params = { params: Promise<{ id: string }> };

/**
 * Replace a gallery image's file, keeping the entry (category, alt, caption).
 * Cloudinary images are overwritten in place, so wherever the image is
 * already used (itineraries, proposals, pages) shows the new one. The new
 * file is watermarked like any upload.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("galleries", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const item = await prisma.gallery.findUnique({
    where: { id },
    select: { id: true, type: true, publicId: true, category: true },
  });
  if (!item) return NextResponse.json({ error: "Image not found" }, { status: 404 });
  if (item.type !== "IMAGE") {
    return NextResponse.json({ error: "Only images can be replaced." }, { status: 400 });
  }

  let file: File | null;
  try {
    file = (await req.formData()).get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Images must be JPG, PNG, or WebP." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "File too large (max 500 KB)" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!checkMagicBytes(buffer, file.type)) {
    return NextResponse.json({ error: "File content does not match the declared image type." }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  try {
    const saved = await replaceUpload(buffer, {
      publicId: item.publicId,
      folder: item.category ?? "general",
      ext,
    });
    const updated = await prisma.gallery.update({
      where: { id },
      data: { url: saved.url, publicId: saved.publicId },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[galleries] replace failed", err);
    return NextResponse.json({ error: "Upload failed — please try again." }, { status: 500 });
  }
}
