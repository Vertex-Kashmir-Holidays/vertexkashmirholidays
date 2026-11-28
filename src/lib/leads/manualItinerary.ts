// Manual itinerary PDF (uploaded by staff, e.g. a 5-star one made outside the
// generator) + a staff-only artifact link, per lead / B2B request. Client-safe.

/** Vercel caps a request body at 4.5 MB, so the upload stays under it. */
export const MAX_MANUAL_ITINERARY_BYTES = 4 * 1024 * 1024;

export function manualItineraryFileError(file: File | null | undefined): string | null {
  if (!file || file.size === 0) return "Choose the itinerary PDF to upload.";
  if (file.type !== "application/pdf") return "The itinerary must be a PDF.";
  if (file.size > MAX_MANUAL_ITINERARY_BYTES) return "The PDF is too large — maximum size is 4 MB.";
  return null;
}

export interface ManualItineraryInfo {
  url: string | null;
  name: string | null;
  /** ISO timestamp of the last upload. */
  uploadedAt: string | null;
  /** Staff-only — never sent to customer/agent pages. */
  artifactUrl: string | null;
}
