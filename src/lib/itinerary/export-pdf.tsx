"use client";

import { pdf } from "@react-pdf/renderer";
import { ItineraryPdf } from "@/components/admin/itinerary/ItineraryPdf";
import { compressMany } from "@/lib/itinerary/compress-image";
import type { ItineraryData } from "@/types/itinerary";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "itinerary";
}

export interface ExportResult {
  bytes: number;
}

/**
 * Compress every referenced image, render the PDF to a Blob, and trigger a
 * browser download. Returns the byte size so callers can warn if it approaches
 * the 1 MB budget.
 */
export async function downloadItineraryPdf(data: ItineraryData): Promise<ExportResult> {
  const srcs = [
    data.coverImage,
    data.transportImage,
    ...data.days.map((d) => d.image),
  ].filter(Boolean);

  // The cover wants a larger, fuller-bleed image; day thumbnails stay tiny.
  const [coverImages, smallImages] = await Promise.all([
    compressMany([data.coverImage].filter(Boolean), { maxWidth: 900, maxHeight: 1300, quality: 0.6 }),
    compressMany(srcs.filter((s) => s !== data.coverImage), { maxWidth: 640, maxHeight: 480, quality: 0.7 }),
  ]);
  const images = { ...smallImages, ...coverImages };

  const blob = await pdf(<ItineraryPdf data={data} images={images} />).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vertex-itinerary-${slugify(data.preparedFor)}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return { bytes: blob.size };
}
