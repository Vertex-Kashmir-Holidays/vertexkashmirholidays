"use client";

import { pdf } from "@react-pdf/renderer";
import { ItineraryPdf, LOGO_ASSETS } from "@/components/admin/itinerary/ItineraryPdf";
import { compressMany } from "@/lib/itinerary/compress-image";
import { getPaymentQr } from "@/lib/itinerary/payment";
import type { ItineraryData } from "@/types/itinerary";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "itinerary"
  );
}

/**
 * Fetch a static asset and return it as a data URL. Used for the brand logo so
 * it embeds losslessly (preserving PNG transparency) rather than going through
 * the JPEG compression path used for photos.
 */
async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
    getPaymentQr(data),
    ...data.days.map((d) => d.image),
  ].filter(Boolean);

  // The cover wants a larger, fuller-bleed image; day thumbnails stay tiny.
  // Brand assets (icon watermark, horizontal lockups, payment-partner strip)
  // embed losslessly via data URLs so PNG transparency survives.
  const [coverImages, smallImages, logos] = await Promise.all([
    compressMany([data.coverImage].filter(Boolean), {
      maxWidth: 900,
      maxHeight: 1300,
      quality: 0.6,
    }),
    compressMany(
      srcs.filter((s) => s !== data.coverImage),
      { maxWidth: 640, maxHeight: 480, quality: 0.7 },
    ),
    Promise.all(
      LOGO_ASSETS.map((src) =>
        fetchAsDataUrl(src).catch((err) => {
          // Silent-drop fallback stays (one missing brand asset shouldn't
          // abort the whole export), but log so this doesn't go unnoticed
          // the way the payment-partner strip did before.
          console.warn(
            `[itinerary-pdf] Failed to embed brand asset "${src}" — it will be omitted from the PDF.`,
            err,
          );
          return "";
        }),
      ),
    ),
  ]);
  const logoMap: Record<string, string> = {};
  LOGO_ASSETS.forEach((src, i) => {
    if (logos[i]) logoMap[src] = logos[i];
  });
  const images = { ...smallImages, ...coverImages, ...logoMap };

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
