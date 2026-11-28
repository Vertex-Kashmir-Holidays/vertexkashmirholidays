// Offer cum Appointment Letter — the fields a letter prints, the department
// presets that drive the role-dependent lines, and the fixed company terms.
// Client-safe (no Node imports): the form, the API and the PDF all share it.
import { z } from "zod";

// ── Fixed terms (company policy, same for every hire) ────────────────────────
// Snapshotted into each letter's data, so an issued letter keeps the terms it
// was issued with even if these change later.
export const FIXED_TERMS = {
  termMonths: 6,
  /** Payable only if the employee leaves / abandons the job before the term ends. */
  earlyExitAmount: 10_000,
  /** Minimum KPI score over the first 6 months for a position / pay revision. */
  kpiThresholdPct: 75,
  annualLeaves: 18,
  payDay: 10,
} as const;

export const SIGNATORY = {
  name: "Farooq Sheikh",
  title: "HR Manager",
  phone: "+91 78895 77789",
  email: "hr@vertexkashmirholidays.com",
  website: "www.vertexkashmirholidays.com",
};

export const LETTER_PLACE = "Gulmarg, Jammu & Kashmir – 193402";

// ── Departments: drive team name, default reporting officer and duties ───────
export const DEPARTMENTS = {
  TECH: {
    label: "Tech",
    team: "Tech Team",
    reportingOfficer: "Farooq Ahmad",
    duties: [
      "Build, maintain and secure the Vertex Kashmir Holidays website, CRM and related applications across the company’s technology stack.",
      "Fix issues promptly, ship improvements and keep systems, backups and access credentials secure.",
    ],
  },
  SALES: {
    label: "Sales",
    team: "Sales Team",
    reportingOfficer: "Mohammad Shafi",
    duties: [
      "Respond promptly to customer enquiries received through calls, WhatsApp, the website and advertising campaigns.",
      "Follow up leads in the CRM, share itineraries and quotations, and convert enquiries into confirmed bookings.",
      "Achieve monthly sales targets and keep every lead’s status, notes and follow-ups up to date in the CRM.",
      "Coordinate with the operations team for a smooth handover of confirmed bookings.",
    ],
  },
  SEO_MARKETING: {
    label: "SEO & Digital Marketing",
    team: "Digital Marketing Team",
    reportingOfficer: "Farooq Ahmad",
    duties: [
      "Plan and execute SEO — keyword research, on-page optimisation, technical fixes and link building.",
      "Support Google and Meta advertising campaigns, landing pages and lead-quality tracking.",
      "Create and optimise content for the website, Google Business Profile and social media.",
      "Report traffic, rankings, leads and campaign performance regularly.",
    ],
  },
  OPERATIONS: {
    label: "Operations",
    team: "Operations Team",
    reportingOfficer: "Farooq Ahmad",
    duties: [
      "Book and confirm hotels, houseboats, cabs and activities for confirmed trips.",
      "Coordinate with guests, drivers and vendors before and during the tour.",
      "Keep booking, payment and confirmation records accurate in the CRM.",
      "Resolve on-trip issues promptly and escalate where needed.",
    ],
  },
  CONTENT_DESIGN: {
    label: "Content & Design",
    team: "Content & Design Team",
    reportingOfficer: "Farooq Ahmad",
    duties: [
      "Create photos, videos, reels, graphics and written content for the website and social media.",
      "Maintain brand consistency across all marketing and customer-facing material.",
      "Keep tour packages, destinations and blog content on the website up to date.",
    ],
  },
  ACCOUNTS: {
    label: "Accounts",
    team: "Accounts Team",
    reportingOfficer: "Farooq Ahmad",
    duties: [
      "Record payments, receipts, expenses and vendor settlements accurately.",
      "Prepare invoices, GST records and periodic financial reports.",
      "Reconcile bank accounts and follow up pending customer and vendor payments.",
    ],
  },
} as const;

export type DepartmentKey = keyof typeof DEPARTMENTS;
export const DEPARTMENT_KEYS = Object.keys(DEPARTMENTS) as DepartmentKey[];

/** Duties every letter ends with, whatever the department. */
export const COMMON_DUTIES = [
  "Maintain accurate records of your work and report progress to your reporting officer.",
  "Use only the Company’s official tools, systems, and communication channels for all work.",
];

/** Best-guess department from the profile: designation keywords first, then the CRM role. */
export function guessDepartment(designation: string | null, role: string): DepartmentKey {
  const d = (designation ?? "").toLowerCase();
  if (/seo|marketing|ads|social/.test(d)) return "SEO_MARKETING";
  if (/develop|engineer|tech|stack|software|it\b/.test(d)) return "TECH";
  if (/sales|business|travel consultant|counsel/.test(d)) return "SALES";
  if (/content|design|editor|video|photo|writer/.test(d)) return "CONTENT_DESIGN";
  if (/account|finance/.test(d)) return "ACCOUNTS";
  if (/operation|reservation|booking|ground/.test(d)) return "OPERATIONS";
  if (role === "SALES") return "SALES";
  if (role === "DEVELOPER") return "TECH";
  if (role === "EDITOR") return "CONTENT_DESIGN";
  return "OPERATIONS";
}

// ── The letter ───────────────────────────────────────────────────────────────

const ymd = z.iso.date("Enter a valid date");

/** What the admin fills / confirms on the form. */
export const offerLetterInputSchema = z.object({
  title: z.enum(["Mr", "Ms", "Mrs"]),
  fullName: z.string().trim().min(2, "Name is required").max(120),
  guardianName: z.string().trim().max(120).optional().default(""),
  /** Postal address, one line per row (PIN on the last line). */
  address: z.string().trim().min(5, "Address is required").max(400),
  designation: z.string().trim().min(2, "Designation is required").max(120),
  engagementType: z.enum(["INTERNSHIP", "EMPLOYMENT"]),
  department: z.enum(DEPARTMENT_KEYS as [DepartmentKey, ...DepartmentKey[]]),
  reportingOfficer: z.string().trim().min(2, "Reporting officer is required").max(120),
  monthlyAmount: z.number().int().positive("Enter the monthly amount").max(10_000_000),
  /** Booking incentive: % of net tour profit on bookings they convert. 0 = no incentive clause.
   *  Defaulted so letters saved before this field existed still parse. */
  commissionPct: z.number().min(0).max(50).default(0),
  joiningDate: ymd,
  letterDate: ymd,
  probationMonths: z.number().int().min(0).max(6),
  noticeMonths: z.number().int().min(0).max(3),
  duties: z.array(z.string().trim().min(3).max(300)).min(1, "Add at least one duty").max(10),
  recipientEmail: z.email("Enter a valid email"),
});
export type OfferLetterInput = z.infer<typeof offerLetterInputSchema>;

/** Stored in OfferLetter.data: the input plus the fixed terms in force. */
export const offerLetterDataSchema = offerLetterInputSchema.extend({
  terms: z.object({
    termMonths: z.number(),
    earlyExitAmount: z.number(),
    kpiThresholdPct: z.number(),
    annualLeaves: z.number(),
    payDay: z.number(),
  }),
});
export type OfferLetterData = z.infer<typeof offerLetterDataSchema>;

export function withFixedTerms(input: OfferLetterInput): OfferLetterData {
  return { ...input, terms: { ...FIXED_TERMS } };
}

// ── Date helpers ("YYYY-MM-DD" calendar days, no timezone drift) ─────────────

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parts(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m, d };
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** "2026-06-01" → "1st June 2026" */
export function longDate(day: string): string {
  const { y, m, d } = parts(day);
  return `${ordinal(d)} ${MONTHS[m - 1]} ${y}`;
}

/** "2026-06-01" → "01-June-2026" (the letter's header date style) */
export function headerDate(day: string): string {
  const { y, m, d } = parts(day);
  return `${String(d).padStart(2, "0")}-${MONTHS[m - 1]}-${y}`;
}

/** Last day of a term of `months` starting on `day` ("2026-06-01" + 6 → "2026-11-30"). */
export function termEndDate(day: string, months: number): string {
  const { y, m, d } = parts(day);
  const end = new Date(Date.UTC(y, m - 1 + months, d) - 86_400_000);
  return end.toISOString().slice(0, 10);
}

/** Number to words for small counts used in the letter ("6 (six)"). */
export function smallNumberWord(n: number): string {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  return words[n] ?? String(n);
}

/** Reference number: VKH/<year>/<DDMM of letter date>/<sequence in that year>. */
export function buildRefNo(letterDate: string, sequence: number): string {
  const { y, m, d } = parts(letterDate);
  return `VKH/${y}/${String(d).padStart(2, "0")}${String(m).padStart(2, "0")}/${sequence}`;
}
