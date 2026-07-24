import type { OfflineConversionPlatform, OfflineConversionStatus } from "@prisma/client";

// Shared, platform-agnostic display/diagnostic helpers for the admin Offline
// Conversions module (src/app/admin/offline-conversions,
// src/components/admin/offlineConversions). Read-only presentation logic
// only — never imports an adapter, never touches the queue/service, never
// writes to the OfflineConversion table. New platforms only need one line
// added to each map/switch below — no UI changes required.
//
// Client-safe by design — this file is imported directly by
// OfflineConversionsClient.tsx / OfflineConversionDetail.tsx. Anything that
// reads a secret env var or makes a real network call belongs in
// ./offlineConversionsServer.ts instead, never here.

export const PLATFORM_LABELS: Record<OfflineConversionPlatform, string> = {
  GOOGLE: "Google Ads",
  META: "Meta",
  MICROSOFT: "Microsoft Ads",
};

// Badge colors — distinct per platform so the list/detail views read at a
// glance. Adding TikTok/LinkedIn later is one line here, no component changes.
export const PLATFORM_BADGE_STYLES: Record<OfflineConversionPlatform, string> = {
  GOOGLE: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  META: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  MICROSOFT: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
};

export const STATUS_LABELS: Record<OfflineConversionStatus, string> = {
  PENDING: "Pending",
  SENT: "Sent",
  FAILED: "Failed",
};

// UI-level status palette. Includes labels/colors for states the current
// 3-value DB enum (PENDING/SENT/FAILED) doesn't emit yet (PROCESSING/RETRYING/
// CANCELLED) so the module doesn't need UI changes if those are ever added —
// today only the three enum values are actually reachable.
export const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  PROCESSING: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  SENT: "bg-green-500/15 text-green-700 dark:text-green-300",
  FAILED: "bg-red-500/15 text-red-700 dark:text-red-300",
  RETRYING: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  CANCELLED: "bg-muted text-muted-foreground",
};

/** "Lead Conversion" vs "Booking Payment" — derived from which FK is set, not a stored field. */
export function deriveEventName(row: { leadId: string | null; bookingId: string | null }): string {
  if (row.leadId) return "Lead Conversion";
  if (row.bookingId) return "Booking Payment";
  return "Unknown";
}

/** A FAILED row can always be manually retried (retryRow has no attempt ceiling — only the automatic processPending() sweep does). */
export function isRetryable(status: OfflineConversionStatus): boolean {
  return status === "FAILED";
}

// ── Failure classification ───────────────────────────────────────────────────
// UI-only categorization of the already-stored lastError string. Never
// modifies what's persisted — the raw error is always shown alongside this.

export interface FailureClassification {
  code: string;
  title: string;
}

type ClassifyRule = { code: string; title: string; match: (e: string) => boolean };

const GOOGLE_RULES: ClassifyRule[] = [
  {
    code: "API_DISABLED",
    title: "API Disabled",
    match: (e) => /has not been used|is disabled/i.test(e),
  },
  {
    code: "PERMISSION_DENIED",
    title: "Permission Denied",
    match: (e) => /permission|PERMISSION_DENIED|not allowlisted|not have access/i.test(e),
  },
  {
    code: "INVALID_CONVERSION_ACTION",
    title: "Invalid Conversion Action",
    match: (e) => /conversion action|productDestinationId|destination/i.test(e),
  },
  { code: "INVALID_GCLID", title: "Invalid GCLID", match: (e) => /gclid|click id/i.test(e) },
  {
    code: "INVALID_TOKEN",
    title: "Invalid Token",
    match: (e) => /token|unauthorized|invalid_grant/i.test(e),
  },
  {
    code: "RATE_LIMIT",
    title: "Rate Limited",
    match: (e) => /rate.?limit|quota|too many requests|RESOURCE_EXHAUSTED/i.test(e),
  },
  {
    code: "INVALID_PAYLOAD",
    title: "Invalid Payload",
    match: (e) => /invalid_argument|invalid.*(field|argument|request)/i.test(e),
  },
  {
    code: "TERMS_NOT_ACCEPTED",
    title: "Terms Not Accepted",
    match: (e) => /terms|not.?signed|data processing/i.test(e),
  },
  {
    code: "NETWORK",
    title: "Network Error",
    match: (e) => /network|ECONNRESET|ETIMEDOUT|fetch failed/i.test(e),
  },
  {
    code: "NOT_CONFIGURED",
    title: "Not Configured",
    match: (e) => /not (fully )?configured/i.test(e),
  },
];

const META_RULES: ClassifyRule[] = [
  {
    code: "INVALID_ACCESS_TOKEN",
    title: "Invalid Access Token",
    match: (e) => /access token|unauthorized|token/i.test(e),
  },
  { code: "PIXEL_NOT_FOUND", title: "Pixel Not Found", match: (e) => /pixel/i.test(e) },
  {
    code: "INVALID_EVENT",
    title: "Invalid Event",
    match: (e) => /invalid.*(event|argument|request)/i.test(e),
  },
  {
    code: "RATE_LIMIT",
    title: "Rate Limited",
    match: (e) => /rate.?limit|quota|too many requests/i.test(e),
  },
  {
    code: "NETWORK",
    title: "Network Error",
    match: (e) => /network|ECONNRESET|ETIMEDOUT|fetch failed/i.test(e),
  },
  {
    code: "NOT_CONFIGURED",
    title: "Not Configured",
    match: (e) => /not (fully )?configured/i.test(e),
  },
];

// Microsoft's adapter is still a TODO stub (see src/lib/offlineConversion/adapters/microsoft.ts)
// — reuses the generic set until it has real error text of its own to classify against.
const GENERIC_RULES: ClassifyRule[] = [
  {
    code: "NOT_CONFIGURED",
    title: "Not Configured",
    match: (e) => /not (fully )?configured|not yet wired/i.test(e),
  },
  {
    code: "RATE_LIMIT",
    title: "Rate Limited",
    match: (e) => /rate.?limit|quota|too many requests/i.test(e),
  },
  {
    code: "NETWORK",
    title: "Network Error",
    match: (e) => /network|ECONNRESET|ETIMEDOUT|fetch failed/i.test(e),
  },
];

const RULES_BY_PLATFORM: Record<OfflineConversionPlatform, ClassifyRule[]> = {
  GOOGLE: GOOGLE_RULES,
  META: META_RULES,
  MICROSOFT: GENERIC_RULES,
};

/** Platform-aware short classification of a lastError string. UI-only — never touches the stored value. */
export function classifyFailure(
  platform: OfflineConversionPlatform,
  error: string | null,
): FailureClassification {
  if (!error) return { code: "NONE", title: "—" };
  const rule = RULES_BY_PLATFORM[platform]?.find((r) => r.match(error));
  return rule
    ? { code: rule.code, title: rule.title }
    : { code: "UNKNOWN", title: "Unknown Error" };
}

// ── Request ID extraction ────────────────────────────────────────────────────

/**
 * Best-effort extraction from whatever shape a platform's response JSON
 * happens to have — Google's Data Manager API puts a top-level `requestId`;
 * other platforms may use a different key or none at all. Absence is shown
 * plainly, not treated as an error.
 */
export function extractRequestId(platformResponse: string | null): string | null {
  if (!platformResponse) return null;
  try {
    const parsed = JSON.parse(platformResponse) as Record<string, unknown>;
    const candidate = parsed.requestId ?? parsed.request_id ?? parsed.id;
    return typeof candidate === "string" ? candidate : null;
  } catch {
    return null;
  }
}

/** Best-effort — a numeric HTTP status is sometimes embedded in the free-text error; not every error carries one. */
export function extractHttpStatus(error: string | null): string | null {
  if (!error) return null;
  const match = error.match(/\b([1-5]\d{2})\b/);
  return match ? match[1] : null;
}

// ── Relative time ─────────────────────────────────────────────────────────────

export function timeAgo(date: Date | string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── CSV export (pure, client-safe — operates on already-loaded rows) ────────

export interface CsvRow {
  leadName: string | null;
  bookingName: string | null;
  platform: OfflineConversionPlatform;
  status: OfflineConversionStatus;
  attempts: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  requestId: string | null;
  failureTitle: string;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Builds a CSV string for the given rows — no server round-trip, reuses whatever's already loaded in the browser. */
export function buildCsv(rows: CsvRow[]): string {
  const header = [
    "Lead",
    "Booking",
    "Platform",
    "Status",
    "Attempts",
    "Created",
    "Last Attempt",
    "Request ID",
    "Failure",
  ];
  const lines = rows.map((r) =>
    [
      r.leadName ?? "",
      r.bookingName ?? "",
      PLATFORM_LABELS[r.platform],
      STATUS_LABELS[r.status],
      String(r.attempts),
      new Date(r.createdAt).toISOString(),
      new Date(r.updatedAt).toISOString(),
      r.requestId ?? "",
      r.failureTitle,
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
