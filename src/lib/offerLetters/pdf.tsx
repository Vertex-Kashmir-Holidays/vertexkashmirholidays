// Server-only: renders an OfferLetter to a PDF buffer. The signature image
// lives in src/lib/offerLetters/assets (not public/) so it is never served
// as a standalone file — it only ever appears inside a generated letter.
import { readFile } from "fs/promises";
import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { OfferLetterPdf } from "./OfferLetterDocument";
import type { OfferLetterData } from "./schema";

const cache = new Map<string, string | null>();

async function dataUrl(file: string): Promise<string | null> {
  if (cache.has(file)) return cache.get(file)!;
  try {
    const buf = await readFile(path.join(process.cwd(), file));
    const url = `data:image/png;base64,${buf.toString("base64")}`;
    cache.set(file, url);
    return url;
  } catch {
    cache.set(file, null);
    return null;
  }
}

/** "Vertex-Offer-Letter-Owais-Hassan-Wani.pdf" */
export function offerLetterFilename(fullName: string): string {
  const slug = fullName.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `Vertex-Offer-Letter-${slug || "Employee"}.pdf`;
}

export async function renderOfferLetterPdf(data: OfferLetterData, refNo: string): Promise<Buffer> {
  const [logo, signature] = await Promise.all([
    dataUrl("public/brand/png/horizontal/vertex-horizontal-light-1600w.png"),
    dataUrl("src/lib/offerLetters/assets/signature-javed-sheikh.png"),
  ]);
  return renderToBuffer(<OfferLetterPdf data={data} refNo={refNo} logo={logo} signature={signature} />);
}
