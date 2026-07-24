import { readFile } from "fs/promises";
import path from "path";

export { PDF_COLORS, PDF_CONTACT, inr } from "./contact";

// The brand mark embedded into PDFs as a data URL. Read once from disk and cached
// for the lifetime of the server process (the file never changes at runtime).
let logoCache: string | null | undefined;

export async function loadLogoDataUrl(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    const buf = await readFile(
      path.join(process.cwd(), "public", "brand", "kit", "png", "icon", "vertex-icon-512.png"),
    );
    logoCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    logoCache = null;
  }
  return logoCache;
}
