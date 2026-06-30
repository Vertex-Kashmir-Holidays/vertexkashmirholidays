export const PLACEHOLDER_IMAGE = "/brand/png/icon/vertex-icon-512.png";

// Returns the given image src, or the branded placeholder when it is missing/blank.
export function imgSrc(src?: string | null): string {
  return src && src.trim() ? src : PLACEHOLDER_IMAGE;
}
