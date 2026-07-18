import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireStaff } from "@/lib/permissions";
import {
  isCloudinaryConfigured,
  ensureCloudinaryConfig,
  cloudinaryUploadFolder,
} from "@/lib/storage";

// Signs a direct browser → Cloudinary upload so large files (videos) never
// pass through our own serverless function — Vercel hard-caps Serverless
// Function request bodies at ~4.5 MB, well under our 10 MB video limit.
export async function POST(req: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary is not configured on this server." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const rawFolder = typeof body.folder === "string" ? body.folder : "general";
  const folder = cloudinaryUploadFolder(rawFolder);
  const publicId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = Math.round(Date.now() / 1000);

  ensureCloudinaryConfig();
  const { api_key: apiKey, cloud_name: cloudName, api_secret: apiSecret } = cloudinary.config();
  if (!apiKey || !cloudName || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured on this server." },
      { status: 503 },
    );
  }

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, public_id: publicId },
    apiSecret,
  );

  return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder, publicId });
}
