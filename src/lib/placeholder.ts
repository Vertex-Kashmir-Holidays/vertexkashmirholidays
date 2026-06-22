// Branded fallback used wherever a section/card image slot is empty. The asset
// (public/brand/placeholder.svg) carries the Vertex logo mark + an "image
// placeholder" label so empty slots read as intentional rather than broken.
// next/image renders it directly (dangerouslyAllowSVG is enabled in next.config).
export const PLACEHOLDER_IMAGE = "/brand/placeholder.svg";

// Returns the given image src, or the branded placeholder when it is missing/blank.
export function imgSrc(src?: string | null): string {
  return src && src.trim() ? src : PLACEHOLDER_IMAGE;
}
