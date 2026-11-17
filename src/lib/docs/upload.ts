// Document upload checks + storage, shared by the Docs library
// (/api/admin/docs) and per-agent documents (/api/admin/b2b-agents/[id]/documents).
import type { Prisma } from "@prisma/client";
import { saveUpload } from "@/lib/storage";
import { B2B_VISIBLE_DOC_CATEGORIES, DOC_EXT_BY_MIME } from "@/lib/docs/categories";

export const MAX_DOC_BYTES = 1 * 1024 * 1024; // 1 MB
export const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
]);

/** The file's problem in plain words, or null when it can be uploaded. */
export function docFileError(file: FormDataEntryValue | null): string | null {
  if (!(file instanceof File) || file.size === 0) return "Please choose a file to upload.";
  if (!ALLOWED_DOC_TYPES.has(file.type)) return "File must be a PDF, DOC, DOCX, PNG, or JPG.";
  if (file.size > MAX_DOC_BYTES) return "File is too large — maximum size is 1 MB.";
  return null;
}

/**
 * Store a validated document file (Cloudinary, or local disk in dev).
 * resourceType "raw": "auto" stores PDFs as resource_type "image", which
 * Cloudinary's PDF/ZIP delivery-security setting blocks; "raw" serves as-is.
 */
export async function storeDocFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, publicId } = await saveUpload(buffer, {
    folder: "docs",
    ext: DOC_EXT_BY_MIME[file.type],
    isImage: false,
    resourceType: "raw",
  });
  return { url, publicId, mimeType: file.type, sizeBytes: file.size };
}

/**
 * Documents a B2B agent can see: B2B-category library docs shared with every
 * agent, plus the ones shared with them alone.
 */
export function agentVisibleDocsWhere(agentId: string): Prisma.AdminDocumentWhereInput {
  return {
    OR: [
      { agentId: null, category: { in: B2B_VISIBLE_DOC_CATEGORIES as string[] } },
      { agentId },
    ],
  };
}
