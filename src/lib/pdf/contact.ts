// Plain constants only — no Node.js imports — so this is safe to import from
// both server PDF-generation code and client preview components alike.
// src/lib/pdf/assets.ts re-exports these for existing server-side callers.

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
  company: "Vertex Kashmir Tour & Travels",
  brand: "Vertex Kashmir Holidays",
  reg: "J&K Tourism Registration number - JKEA00001840",
  phone: "+91-7889577789 / +91-9682648388",
  address: "Katipora, Tangmarg, Baramulla, Jammu & Kashmir 193402, India",
  email: "support@vertexkashmirholidays.com",
};

export const inr = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
