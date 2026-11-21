import type { LeadStatus } from "@prisma/client";

// Badge colours + labels for a lead's status — shared by the Leads list, the
// lead detail page and the dashboard so a status always looks the same.
export const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-link/10 text-link",
  CONNECTED: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  NOT_CONNECTED: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  QUALIFIED: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  NEGOTIATION: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ON_HOLD: "bg-muted text-muted-foreground",
  // B2B-request-only value — normal leads never use it; present so the
  // Record type-checks.
  IN_PROGRESS: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  CONVERTED: "bg-green-500/15 text-green-700 dark:text-green-300",
  REJECTED: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONNECTED: "Connected",
  NOT_CONNECTED: "Not connected",
  QUALIFIED: "Qualified",
  NEGOTIATION: "Negotiation",
  ON_HOLD: "On hold",
  IN_PROGRESS: "In progress",
  CONVERTED: "Converted",
  REJECTED: "Rejected",
};

