import { readFile } from "fs/promises";
import path from "path";

// Brand palette — kept in sync with the itinerary PDF so every document Vertex
// sends looks like it came from the same company.
export const PDF_COLORS = {
  green: "#1d5c43",
  greenDark: "#10261b",
  mint: "#6abf8e",
  lightGreen: "#e3f0e9",
  cream: "#f7f4ee",
  border: "#e4e0d8",
  ink: "#2b2b2b",
  muted: "#7a7a72",
  rose: "#e11d48",
  white: "#ffffff",
};

// Single source of truth for company contact details on outbound documents.
export const PDF_CONTACT = {
  company: "Vertex Kashmir Tour & Travel",
  brand: "Vertex Kashmir Holidays",
  reg: "J&K Tourism Registration number - JKTA0004560",
  phone: "+91-7889577789 / +91-9682648388",
  address: "Tangmarg, Gulmarg, India - 193402",
  email: "support@vertexkashmirholidays.com",
};

// The brand mark embedded into PDFs as a data URL. Read once from disk and cached
// for the lifetime of the server process (the file never changes at runtime).
let logoCache: string | null | undefined;

export async function loadLogoDataUrl(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "brand", "kit", "png", "icon", "vertex-icon-512.png"));
    logoCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    logoCache = null;
  }
  return logoCache;
}

export const inr = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
