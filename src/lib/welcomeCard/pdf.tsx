// Server-only: renders a booking's guest welcome card to a PDF buffer.
import { readFile } from "fs/promises";
import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { addDays, todayIst } from "@/lib/trips/board";
import { WelcomeCardPdf, type WelcomeCardData } from "./WelcomeCardDocument";

const LOGO_FILE = "public/brand/png/stacked/vertex-stacked-light-1200w.png";
let logoCache: Promise<string | null> | null = null;
function logo(): Promise<string | null> {
  logoCache ??= readFile(path.join(process.cwd(), LOGO_FILE))
    .then((b) => `data:image/png;base64,${b.toString("base64")}`)
    .catch(() => null);
  return logoCache;
}

/** "YYYY-MM-DD" from which the card can be downloaded — the day before travel. */
export function welcomeCardAvailableFrom(travelDate: Date): string {
  return addDays(travelDate.toISOString().slice(0, 10), -1);
}

export function isWelcomeCardAvailable(travelDate: Date, now: Date = new Date()): boolean {
  return todayIst(now) >= welcomeCardAvailableFrom(travelDate);
}

/** "Vertex-Welcome-Card-Khadim-Khatri.pdf" */
export function welcomeCardFilename(guestName: string): string {
  const slug = guestName.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `Vertex-Welcome-Card-${slug || "Guest"}.pdf`;
}

export async function renderWelcomeCardPdf(data: WelcomeCardData): Promise<Buffer> {
  return renderToBuffer(<WelcomeCardPdf data={data} logo={await logo()} />);
}
