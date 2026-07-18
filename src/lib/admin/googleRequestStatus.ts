// Read-only diagnostic lookup against Google's Data Manager API
// requestStatus:retrieve method — used by the admin "Check Status" action.
// Deliberately NOT part of src/lib/offlineConversion/ (the upload/queue/retry
// architecture): this never enqueues, sends, or mutates a queue row. It only
// asks Google "what happened to this requestId" and returns a message for
// display. Uses the same OAuth credentials as the runtime adapter but is a
// fully separate, additive read path.
//
// Verified against developers.google.com/data-manager/api/reference/rest/v1/requestStatus/retrieve.

import { env } from "@/lib/env";

const STATUS_URL = "https://datamanager.googleapis.com/v1/requestStatus:retrieve";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

type RequestStatus =
  "REQUEST_STATUS_UNKNOWN" | "SUCCESS" | "PROCESSING" | "FAILED" | "PARTIAL_SUCCESS";

interface RequestStatusPerDestination {
  requestStatus?: RequestStatus;
  errorInfo?: { errorCounts?: { recordCount?: string; reason?: string }[] };
  warningInfo?: { warningCounts?: { recordCount?: string; reason?: string }[] };
}

interface RetrieveRequestStatusResponse {
  requestStatusPerDestination?: RequestStatusPerDestination[];
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json().catch(() => null)) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  } | null;
  if (!res.ok || !json?.access_token) {
    throw new Error(
      json?.error_description ?? json?.error ?? `Token refresh failed (${res.status})`,
    );
  }
  return json.access_token;
}

export interface RequestStatusResult {
  ok: boolean;
  status: RequestStatus | "NOT_YET_AVAILABLE" | "ERROR";
  message: string;
  raw?: unknown;
}

/** Checks the real outcome of a previously-accepted Google Data Manager API request. */
export async function checkGoogleRequestStatus(requestId: string): Promise<RequestStatusResult> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_ADS_REFRESH_TOKEN) {
    return { ok: false, status: "ERROR", message: "Google Ads credentials not configured." };
  }

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(`${STATUS_URL}?requestId=${encodeURIComponent(requestId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = (await res.json().catch(() => null)) as
      (RetrieveRequestStatusResponse & { error?: { message?: string } }) | null;

    if (!res.ok) {
      return {
        ok: false,
        status: "ERROR",
        message: json?.error?.message ?? `Google returned HTTP ${res.status}`,
        raw: json,
      };
    }

    const statuses = json?.requestStatusPerDestination ?? [];
    if (statuses.length === 0) {
      return {
        ok: true,
        status: "NOT_YET_AVAILABLE",
        message:
          "No status yet — Google recommends waiting at least 30 minutes after upload before checking.",
        raw: json,
      };
    }

    const parts = statuses.map((s) => {
      const status = s.requestStatus ?? "REQUEST_STATUS_UNKNOWN";
      if (status === "SUCCESS") return "Confirmed — Google accepted and processed this conversion.";
      if (status === "PROCESSING") return "Still processing on Google's side — check again later.";
      if (status === "PARTIAL_SUCCESS") {
        const reasons = s.warningInfo?.warningCounts
          ?.map((w) => w.reason)
          .filter(Boolean)
          .join(", ");
        return `Partially accepted${reasons ? ` — ${reasons}` : ""}.`;
      }
      if (status === "FAILED") {
        const reasons = s.errorInfo?.errorCounts
          ?.map((e) => e.reason)
          .filter(Boolean)
          .join(", ");
        return `Rejected by Google${reasons ? ` — ${reasons}` : ""}.`;
      }
      return "Unknown status returned by Google.";
    });

    const overall: RequestStatus = statuses[0]?.requestStatus ?? "REQUEST_STATUS_UNKNOWN";
    const anyFailed = statuses.some((s) => s.requestStatus === "FAILED");

    return { ok: !anyFailed, status: overall, message: parts.join(" "), raw: json };
  } catch (err) {
    return {
      ok: false,
      status: "ERROR",
      message: err instanceof Error ? err.message : "Status check failed.",
    };
  }
}
