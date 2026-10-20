// Lead qualification — "What's your budget per person?" + "When are you
// planning to travel?" — asked in lead forms and the WhatsApp modal, by
// context: generic pages ask both; tour pages/cards ask the month only (the
// budget band is derived from the tour's price); activities ask the month only
// with no budget; offer pages pre-fill from the chosen tier and trip date.
// Client-safe (no prisma): the server-side band lookup lives in
// budgetBands.server.ts.

import { z } from "zod";

/** "Not sure yet" — a valid answer to either question. */
export const UNDECIDED = "undecided";
/** "Later than that" — beyond the listed months. */
export const LATER = "later";
/** Months listed after the current one. */
export const TRAVEL_MONTHS_AHEAD = 6;

export interface BudgetBandOption {
  key: string;
  label: string;
  minAmount: number;
  maxAmount: number | null;
}

export interface Qualification {
  budgetBandKey: string;
  travelMonth: string;
}

/** Where a WhatsApp click / lead form sits — decides which questions are asked. */
export type QualificationContext =
  | { kind: "generic" }
  | { kind: "offer" }
  | { kind: "activity" }
  /** Budget derived from the tour's price per person; `name` is its trimmed title. */
  | { kind: "tour"; pricePerPerson: number; name: string };

export const budgetBandKeyField = z
  .string()
  .trim()
  .min(1, "Choose your budget (or “Not sure yet”).")
  .max(20);

export const travelMonthField = z
  .string()
  .regex(
    /^(\d{4}-(0[1-9]|1[0-2])|later|undecided)$/,
    "Choose when you're travelling (or “Not sure yet”).",
  );

// ── Months ─────────────────────────────────────────────────────────────────

function monthKey(year: number, monthIndex: number): string {
  const d = new Date(Date.UTC(year, monthIndex, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The current month (India time) plus the next six, as "YYYY-MM". */
export function travelMonthKeys(now: Date = new Date()): string[] {
  const [y, m] = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).split("-");
  return Array.from({ length: TRAVEL_MONTHS_AHEAD + 1 }, (_, i) =>
    monthKey(Number(y), Number(m) - 1 + i),
  );
}

function formatMonth(key: string, month: "long" | "short"): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month,
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2027-01" → "Jan 2027" (chips). */
export const shortMonthLabel = (key: string) => formatMonth(key, "short");

/** A stored travelMonth as text — "January 2027", "later than April 2027",
 *  "Not sure yet". `asOf` anchors "later than …" (use the lead's createdAt). */
export function travelMonthText(key: string, asOf: Date = new Date()): string {
  if (key === UNDECIDED) return "Not sure yet";
  if (key === LATER) {
    const keys = travelMonthKeys(asOf);
    return `later than ${formatMonth(keys[keys.length - 1], "long")}`;
  }
  return formatMonth(key, "long");
}

/** Valid for a submission now: a listed month (or the previous one, to absorb
 *  a page left open across midnight), "later" or "undecided". */
export function isValidTravelMonth(key: string, now: Date = new Date()): boolean {
  if (key === LATER || key === UNDECIDED) return true;
  const keys = travelMonthKeys(now);
  const [y, m] = keys[0].split("-").map(Number);
  return keys.includes(key) || key === monthKey(y, m - 2);
}

// ── Budget ─────────────────────────────────────────────────────────────────

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** A band's display label, generated from its range — "₹17,000 – ₹21,999", "₹28,000+". */
export function bandLabel(minAmount: number, maxAmount: number | null): string {
  return maxAmount == null ? `${inr(minAmount)}+` : `${inr(minAmount)} – ${inr(maxAmount)}`;
}

/** The band a price PER PERSON falls in (a tour's priceFrom, an offer tier ÷ 2). */
export function bandForPrice(
  bands: BudgetBandOption[],
  pricePerPerson: number,
): BudgetBandOption | undefined {
  return bands.find(
    (b) => pricePerPerson >= b.minAmount && (b.maxAmount == null || pricePerPerson <= b.maxAmount),
  );
}

/** WhatsApp text for a budget answer — "₹17,000–21,999 per person", "₹28,000+ per person". */
export function budgetText(bands: BudgetBandOption[], key: string): string {
  if (key === UNDECIDED) return "Not sure yet";
  const band = bands.find((b) => b.key === key);
  if (!band) return "Not sure yet";
  return band.maxAmount == null
    ? `${inr(band.minAmount)}+ per person`
    : `${inr(band.minAmount)}–${band.maxAmount.toLocaleString("en-IN")} per person`;
}

/**
 * The lines added to a WhatsApp message. No budget answer (activity context)
 * means no Budget line; `derivedFrom` (a tour's trimmed title) is appended when
 * the band came from the tour's price.
 */
export function qualificationLines(
  bands: BudgetBandOption[],
  q: { budgetBandKey?: string; travelMonth: string },
  now: Date = new Date(),
  derivedFrom?: string,
): string {
  const travel = `Travelling: ${travelMonthText(q.travelMonth, now)}`;
  if (!q.budgetBandKey) return travel;
  const budget = `Budget: ${budgetText(bands, q.budgetBandKey)}${derivedFrom ? ` (${derivedFrom})` : ""}`;
  return `${budget}\n${travel}`;
}

/** "Kashmir Family Tour Package - 5 Nights 6 Days " → "Kashmir Family Tour Package". */
export function trimTourTitle(title: string): string {
  return title
    .trim()
    .replace(/\s*[|\-–—:]?\s*\(?\d+\s*N(ights?)?\s*[/&,]?\s*\d+\s*D(ays?)?\)?\s*$/i, "")
    .trim();
}

// ── Context on the page ────────────────────────────────────────────────────
// Sections and cards mark themselves with data-wa-context (+ data-wa-price /
// data-wa-name for tours); a click or form reads the NEAREST one, so the
// header/footer/floating button stay generic even on a tour page, and a tour
// card inside an activity page is a tour.

export function contextAttrs(ctx: QualificationContext): Record<string, string> {
  if (ctx.kind !== "tour") return { "data-wa-context": ctx.kind };
  return {
    "data-wa-context": "tour",
    "data-wa-price": String(Math.round(ctx.pricePerPerson)),
    "data-wa-name": ctx.name,
  };
}

export function readContext(el: Element | null): QualificationContext {
  const host = el?.closest<HTMLElement>("[data-wa-context]");
  const kind = host?.dataset.waContext;
  if (kind === "tour") {
    const pricePerPerson = Number(host?.dataset.waPrice);
    if (pricePerPerson > 0)
      return { kind: "tour", pricePerPerson, name: host?.dataset.waName ?? "" };
  }
  if (kind === "offer" || kind === "activity") return { kind };
  return { kind: "generic" };
}

const REF_TAG_RE = /\s*\[Ref: [^\]]+\]\s*$/;

/**
 * Adds the qualification lines to a wa.me link's prefilled message, before the
 * Ref tag. The message is kept as-is; the tag is `refTag` when given (a token
 * minted or updated after the link was rendered), else the link's own.
 */
export function withQualificationLines(href: string, lines: string, refTag?: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  const text = url.searchParams.get("text") ?? "";
  const existingTag = text.match(/\[Ref: ([^\]]+)\]\s*$/)?.[1];
  const base = text.replace(REF_TAG_RE, "").trimEnd();
  const tag = refTag ?? existingTag;
  const message = [base, lines, tag ? `[Ref: ${tag}]` : ""].filter(Boolean).join("\n\n");
  url.searchParams.set("text", message);
  return url.toString();
}

// ── Remembered answers (this browser session) ──────────────────────────────

const SESSION_KEY = "vkh_qualification";
const listeners = new Set<() => void>();

export function readSessionQualification(): Partial<Qualification> {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    const q = raw ? (JSON.parse(raw) as Partial<Qualification>) : {};
    // A remembered month that has since dropped out of the window is re-asked.
    if (q.travelMonth && !isValidTravelMonth(q.travelMonth)) delete q.travelMonth;
    return q;
  } catch {
    return {};
  }
}

export function writeSessionQualification(next: Partial<Qualification>): void {
  try {
    const merged = { ...readSessionQualification(), ...next };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(merged));
  } catch {
    // Storage blocked (private mode etc.) — the answers just aren't remembered.
  }
  listeners.forEach((l) => l());
}

export function subscribeSessionQualification(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ── Page-provided defaults (offer pages) ───────────────────────────────────
// An offer page already knows the trip's month and, once a tier is picked, its
// price — it registers them here so forms and the WhatsApp modal start with
// those answers selected instead of asking again.

let pageDefaults: Partial<Qualification> = {};

export function setPageQualificationDefaults(defaults: Partial<Qualification>): void {
  pageDefaults = defaults;
  listeners.forEach((l) => l());
}

export function getPageQualificationDefaults(): Partial<Qualification> {
  return pageDefaults;
}

/** Starting answers: page context first (offer tier/date), then the session. */
export function initialQualification(): Partial<Qualification> {
  return { ...readSessionQualification(), ...stripEmpty(pageDefaults) };
}

function stripEmpty(q: Partial<Qualification>): Partial<Qualification> {
  return Object.fromEntries(Object.entries(q).filter(([, v]) => !!v));
}
