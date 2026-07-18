import crypto from "crypto";
import type { PlatformAdapter } from "../types";
import { env as appEnv } from "@/lib/env";

// Google Ads offline conversions / enhanced conversions for leads — via the
// Data Manager API. Google deprecated new access to the legacy
// ConversionUploadService.UploadClickConversions method (Google Ads API)
// starting 2026-06-15 for any developer token that hadn't already used it;
// Data Manager API is the only currently-documented path for a token/account
// created after that cutoff. Verified against developers.google.com/data-manager
// (events.ingest reference + Google Ads offline-conversions devguide) —
// plain REST, no SDK, same style as the Meta adapter.
const INGEST_URL = "https://datamanager.googleapis.com/v1/events:ingest";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

interface GoogleAdsEnv {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  loginCustomerId: string;
  customerId: string;
  conversionActionId: string;
}

function readEnv(): Partial<GoogleAdsEnv> {
  return {
    clientId: appEnv.GOOGLE_CLIENT_ID,
    clientSecret: appEnv.GOOGLE_CLIENT_SECRET,
    refreshToken: appEnv.GOOGLE_ADS_REFRESH_TOKEN,
    loginCustomerId: appEnv.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    customerId: appEnv.GOOGLE_ADS_CUSTOMER_ID,
    conversionActionId: appEnv.GOOGLE_ADS_CONVERSION_ACTION_ID,
  };
}

function isFullyConfigured(env: Partial<GoogleAdsEnv>): env is GoogleAdsEnv {
  return Object.values(env).every((v) => typeof v === "string" && v.length > 0);
}

// Google Ads account ids are digits only — accept values with or without the
// dashes Google's own UI displays them with (e.g. "591-050-4339").
function digitsOnly(id: string): string {
  return id.replace(/[^\d]/g, "");
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// In-memory access-token cache — avoids a token refresh on every single
// conversion upload within the same warm serverless instance.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(env: GoogleAdsEnv): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      refresh_token: env.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const json = (await res.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error?: string; error_description?: string }
    | null;

  if (!res.ok || !json?.access_token) {
    throw new Error(json?.error_description ?? json?.error ?? `Google token refresh failed (${res.status})`);
  }

  cachedToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

// ── Data Manager API request shapes (per developers.google.com/data-manager/
// api/reference/rest/v1/events/ingest, /Event, /AdIdentifiers, /UserData) ──

interface AdIdentifiers {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
}

interface UserIdentifier {
  emailAddress?: string;
  phoneNumber?: string;
}

interface DataManagerEvent {
  eventTimestamp: string;
  transactionId?: string;
  eventSource: "WEB" | "APP" | "IN_STORE" | "PHONE" | "OTHER";
  currency: string;
  conversionValue?: number;
  adIdentifiers?: AdIdentifiers;
  userData?: { userIdentifiers: UserIdentifier[] };
}

interface Destination {
  operatingAccount: { accountType: "GOOGLE_ADS"; accountId: string };
  loginAccount?: { accountType: "GOOGLE_ADS"; accountId: string };
  productDestinationId: string;
}

interface IngestEventsResponse {
  requestId?: string;
}

export const googleAdapter: PlatformAdapter = {
  platform: "GOOGLE",

  isConfigured(): boolean {
    return isFullyConfigured(readEnv());
  },

  async send(event) {
    const env = readEnv();
    if (!isFullyConfigured(env)) {
      return { success: false, error: "Google Ads credentials not fully configured (see .env.example)" };
    }

    const clickId = event.attribution.gclid ?? event.attribution.gbraid ?? event.attribution.wbraid;
    if (!clickId) {
      return { success: false, error: "No gclid/gbraid/wbraid on this conversion" };
    }

    let accessToken: string;
    try {
      accessToken = await getAccessToken(env);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google token refresh failed";
      console.error("[offlineConversion:google] token refresh failed:", message);
      return { success: false, error: message };
    }

    const customerId = digitsOnly(env.customerId);
    const loginCustomerId = digitsOnly(env.loginCustomerId);

    const destination: Destination = {
      operatingAccount: { accountType: "GOOGLE_ADS", accountId: customerId },
      // Only needed when accessing through a manager (MCC) account, which we are.
      ...(loginCustomerId && loginCustomerId !== customerId
        ? { loginAccount: { accountType: "GOOGLE_ADS" as const, accountId: loginCustomerId } }
        : {}),
      productDestinationId: env.conversionActionId,
    };

    const userIdentifiers: UserIdentifier[] = [];
    if (event.email) userIdentifiers.push({ emailAddress: sha256Hex(event.email.trim().toLowerCase()) });
    // Google wants E.164 (with leading +), unlike Meta which wants digits only —
    // our stored phone numbers are already E.164, so hash as-is.
    if (event.phone) userIdentifiers.push({ phoneNumber: sha256Hex(event.phone.trim()) });

    const dmEvent: DataManagerEvent = {
      eventTimestamp: event.conversionTime.toISOString(),
      eventSource: "WEB",
      currency: event.currency,
      ...(event.dedupeKey ? { transactionId: event.dedupeKey } : {}),
      ...(event.conversionValue !== undefined ? { conversionValue: event.conversionValue } : {}),
      adIdentifiers: {
        ...(event.attribution.gclid ? { gclid: event.attribution.gclid } : {}),
        ...(event.attribution.gbraid ? { gbraid: event.attribution.gbraid } : {}),
        ...(event.attribution.wbraid ? { wbraid: event.attribution.wbraid } : {}),
      },
      ...(userIdentifiers.length > 0 ? { userData: { userIdentifiers } } : {}),
    };

    try {
      const res = await fetch(INGEST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          // Data Manager API ignores request headers beyond standard auth —
          // account targeting (formerly the developer-token / login-customer-id
          // headers under the legacy Ads API) now lives entirely in the body
          // via `destinations`. GOOGLE_ADS_DEVELOPER_TOKEN is no longer used here.
        },
        body: JSON.stringify({ destinations: [destination], events: [dmEvent], encoding: "HEX" }),
      });

      const json = (await res.json().catch(() => null)) as (IngestEventsResponse & { error?: { message?: string } }) | null;

      if (!res.ok) {
        const message = json?.error?.message ?? `Data Manager API returned ${res.status}`;
        console.error(`[offlineConversion:google] ingest HTTP ${res.status}:`, JSON.stringify(json));
        return { success: false, response: json, error: message };
      }

      // IMPORTANT: unlike the deprecated Ads API (which returned a synchronous
      // partialFailureError), events:ingest only confirms the batch was
      // ACCEPTED — requestId here does not mean Google has validated this
      // specific gclid yet. True per-event accept/reject status is only
      // available later via a separate RetrieveRequestStatus call (Google
      // recommends waiting 30+ minutes, then polling with backoff up to 24h).
      // We do not poll that here — see the migration notes for why, and what
      // it would take to add.
      console.log(`[offlineConversion:google] ingest accepted requestId=${json?.requestId ?? "n/a"} transactionId=${event.dedupeKey ?? "n/a"}`);
      return { success: true, response: json };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Data Manager API request failed";
      console.error("[offlineConversion:google] request failed:", message);
      return { success: false, error: message };
    }
  },
};
