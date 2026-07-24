export const MAX_VIDEO_SIZE = 10 * 1024 * 1024;

interface UploadVideoOptions {
  folder?: string;
  alt?: string;
}

type UploadVideoResult = { ok: true; url: string } | { ok: false; error: string };

// Videos upload straight from the browser to Cloudinary (signed) instead of
// through our own /api/uploads route — Vercel hard-caps Serverless Function
// request bodies at ~4.5 MB, well under our 10 MB video limit, so anything
// over that would 413 if proxied through our server.
export async function uploadVideoDirect(
  file: File,
  { folder, alt }: UploadVideoOptions = {},
): Promise<UploadVideoResult> {
  if (file.size > MAX_VIDEO_SIZE) {
    return { ok: false, error: "Video too large (max 10 MB)." };
  }

  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: folder || "general" }),
  });
  if (!signRes.ok) {
    const { error } = await signRes.json().catch(() => ({ error: "" }));
    return { ok: false, error: error || "Couldn't prepare video upload." };
  }
  const {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: cloudFolder,
    publicId,
  } = await signRes.json();

  const cloudFd = new FormData();
  cloudFd.append("file", file);
  cloudFd.append("api_key", apiKey);
  cloudFd.append("timestamp", String(timestamp));
  cloudFd.append("signature", signature);
  cloudFd.append("folder", cloudFolder);
  cloudFd.append("public_id", publicId);
  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: "POST",
    body: cloudFd,
  });
  if (!uploadRes.ok) {
    return { ok: false, error: "Video upload to Cloudinary failed." };
  }
  const uploaded = await uploadRes.json();

  const galleryRes = await fetch("/api/galleries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      type: "VIDEO",
      category: folder || undefined,
      alt: alt || undefined,
    }),
  });
  if (!galleryRes.ok) {
    return { ok: false, error: "Video uploaded, but saving it to the gallery failed." };
  }

  return { ok: true, url: uploaded.secure_url as string };
}
