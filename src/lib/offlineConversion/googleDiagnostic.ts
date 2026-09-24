// TEMPORARY admin-only diagnostic — validates the Google Data Manager API
// offline-conversion setup (OAuth, account/destination access, request shape)
// against the REAL production credentials WITHOUT recording a conversion.
// Delete this file and its route (src/app/api/offline-conversions/diagnostic/
// google/route.ts) once the integration has been verified.
//
// Safety, by construction:
//  - `validateOnly: true` is set here, after the shared buildIngestBody() runs
//    (that builder never emits it), and the exact serialized string that gets
//    sent is re-parsed and asserted to contain it immediately before fetch().
//  - Takes no parameters — no caller input reaches the event, the IDs, or the
//    flag. The event is a fixed, clearly synthetic constant; the click ID
//    matches no real ad click, so it could not be credited even if Google
//    somehow ignored the flag (defense in depth, not the primary guarantee).
//  - No Prisma, no OfflineConversion queue, no Lead/Booking, no
//    enqueueForLead/enqueueForBooking, and it never calls googleAdapter.send().
//  - Aborts BEFORE any network call unless the configured conversion action is
//    exactly EXPECTED_CONVERSION_ACTION_ID.
//
// OAuth: the token refresh is issued here — the identical request to the one in
// adapters/google.ts getAccessToken() — instead of calling that function,
// because getAccessToken() throws only `error_description ?? error`, which
// discards the HTTP status and Google's `error` code (a revoked refresh token
// comes back as just "Bad Request"). Here the failure surfaces Google's status
// plus a WHITELIST of its error fields (never the raw body), with the client
// secret and refresh token redacted, and only non-sensitive shape metadata
// about the configured credentials. Access tokens are never returned or logged.

import type { ConversionEvent } from "./types";
import {
  INGEST_URL,
  buildIngestBody,
  isFullyConfigured,
  readEnv,
  type GoogleAdsEnv,
  type IngestBody,
} from "./adapters/google";

// Same endpoint as adapters/google.ts (private there — see the note above).
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const EXPECTED_CONVERSION_ACTION_ID = "7676573272";

const SYNTHETIC_GCLID = "VKH_DIAGNOSTIC_SYNTHETIC_GCLID_DO_NOT_USE";
const SYNTHETIC_EMAIL = "vkh-diagnostic@example.invalid";
const SYNTHETIC_PHONE = "+12025550100"; // NANP fictional 555-01xx range
const SYNTHETIC_TRANSACTION_ID = "vkh-diagnostic-validate-only";

const NO_CONVERSION_NOTE =
  "validateOnly=true — Google validated the request but did NOT ingest it. No conversion was recorded, nothing was written to the database, and no queue row was created.";

export type DiagnosticStage =
  | "not_configured"
  | "conversion_action_mismatch"
  | "token_refresh_failed"
  | "google_request_failed"
  | "google_rejected"
  | "validated";

/** Whitelisted fields from Google's OAuth token-endpoint failure response. */
export interface OAuthFailureDetails {
  /** HTTP status from oauth2.googleapis.com/token (absent if no response was received). */
  httpStatus?: number;
  /** Google's OAuth `error` code, e.g. "invalid_grant". */
  error?: string;
  errorDescription?: string;
  errorUri?: string;
  /** First 300 chars of a non-JSON error body, secrets redacted. Never set for a 2xx. */
  bodySnippet?: string;
  /** Set when the request got no response at all (DNS/TLS/timeout). */
  networkError?: string;
}

interface ValueShape {
  length: number;
  hasWhitespace: boolean;
  hasQuotes: boolean;
}

/**
 * Non-sensitive shape metadata about the configured credentials — enough to spot
 * a corrupted Vercel env value (stray quotes, trailing newline, truncation)
 * without revealing any characters of a secret. The only characters shown are
 * Google's public format markers ("1//", "GOCSPX-", the client-ID project number).
 */
export interface CredentialShape {
  clientId: ValueShape & { prefix: string; endsWithAppsGoogleusercontent: boolean };
  clientSecret: ValueShape & { startsWithGOCSPX: boolean };
  refreshToken: ValueShape & { startsWithOneSlashSlash: boolean };
}

export interface GoogleDiagnosticResult {
  ok: boolean;
  /** HTTP status the route should respond with. */
  httpStatus: number;
  stage: DiagnosticStage;
  message: string;
  oauth?: OAuthFailureDetails;
  credentialShape?: CredentialShape;
  hint?: string;
  /** Always false — this diagnostic can never record a conversion. */
  conversionRecorded: false;
  validateOnly: true;
  note: string;
  ids?: {
    customerId: string;
    loginCustomerId: string;
    conversionActionId: string;
    expectedConversionActionId: string;
  };
  /** The exact body sent to Google (synthetic data only; identifiers are hashed). */
  request?: IngestBody & { validateOnly: true };
  googleStatus?: number;
  googleResponse?: unknown;
}

const LOG = "[offlineConversion:google:diagnostic]";

function syntheticEvent(): ConversionEvent {
  return {
    attribution: { gclid: SYNTHETIC_GCLID },
    conversionValue: 1,
    currency: "INR",
    // 1 hour ago — safely in the past, never in the future.
    conversionTime: new Date(Date.now() - 60 * 60 * 1000),
    email: SYNTHETIC_EMAIL,
    phone: SYNTHETIC_PHONE,
    dedupeKey: SYNTHETIC_TRANSACTION_ID,
  };
}

function result(
  partial: Omit<GoogleDiagnosticResult, "conversionRecorded" | "validateOnly" | "note">,
): GoogleDiagnosticResult {
  return { ...partial, conversionRecorded: false, validateOnly: true, note: NO_CONVERSION_NOTE };
}

/** Replaces any occurrence of a secret value (6+ chars) with "[REDACTED]". */
function redact(text: string, secrets: string[]): string {
  let out = text;
  for (const secret of secrets) {
    if (secret.length >= 6) out = out.split(secret).join("[REDACTED]");
  }
  return out;
}

function valueShape(value: string): ValueShape {
  return { length: value.length, hasWhitespace: /\s/.test(value), hasQuotes: /["'`]/.test(value) };
}

function describeCredentialShape(env: GoogleAdsEnv): CredentialShape {
  return {
    clientId: {
      ...valueShape(env.clientId),
      prefix: env.clientId.slice(0, 12),
      endsWithAppsGoogleusercontent: env.clientId.endsWith(".apps.googleusercontent.com"),
    },
    clientSecret: {
      ...valueShape(env.clientSecret),
      startsWithGOCSPX: env.clientSecret.startsWith("GOCSPX-"),
    },
    refreshToken: {
      ...valueShape(env.refreshToken),
      startsWithOneSlashSlash: env.refreshToken.startsWith("1//"),
    },
  };
}

type TokenResult = { ok: true; accessToken: string } | { ok: false; details: OAuthFailureDetails };

interface TokenEndpointBody {
  access_token?: unknown;
  error?: unknown;
  error_description?: unknown;
  error_uri?: unknown;
}

function parseTokenBody(text: string): TokenEndpointBody | null {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" ? (value as TokenEndpointBody) : null;
  } catch {
    return null;
  }
}

/**
 * The same OAuth refresh request as adapters/google.ts getAccessToken() (same
 * URL, method, headers and form fields in the same order), but on failure it
 * returns Google's status and error fields instead of a single collapsed string.
 * Sends nothing to the Data Manager API.
 */
async function refreshAccessToken(env: GoogleAdsEnv): Promise<TokenResult> {
  const secrets = [env.clientSecret, env.refreshToken];

  let res: Response;
  try {
    res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.clientId,
        client_secret: env.clientSecret,
        refresh_token: env.refreshToken,
        grant_type: "refresh_token",
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token request failed";
    return { ok: false, details: { networkError: redact(message, secrets) } };
  }

  const text = await res.text().catch(() => "");
  const json = parseTokenBody(text);

  if (res.ok && typeof json?.access_token === "string" && json.access_token) {
    return { ok: true, accessToken: json.access_token };
  }

  // Only whitelisted string fields are copied out — never the raw body — so an
  // unexpected token/credential field in a response can't leak through.
  const details: OAuthFailureDetails = { httpStatus: res.status };
  if (typeof json?.error === "string") details.error = redact(json.error, secrets);
  if (typeof json?.error_description === "string") {
    details.errorDescription = redact(json.error_description, secrets);
  }
  if (typeof json?.error_uri === "string") details.errorUri = redact(json.error_uri, secrets);

  if (res.ok) {
    details.errorDescription = "Token endpoint returned a 2xx response without an access_token.";
  } else if (details.error === undefined && details.errorDescription === undefined) {
    details.bodySnippet = redact(text.slice(0, 300), secrets);
  }
  return { ok: false, details };
}

function hintFor(details: OAuthFailureDetails): string {
  if (details.networkError) {
    return "Could not reach oauth2.googleapis.com (network/DNS/TLS/timeout) — not a credential problem.";
  }
  switch (details.error) {
    case "invalid_grant":
      return "Google rejected the REFRESH TOKEN. It is expired or revoked (a refresh token from an OAuth consent screen still in 'Testing' status expires after 7 days; a password change or removing the app's access revokes it), was issued to a different OAuth client than the configured GOOGLE_CLIENT_ID, or was corrupted when stored — compare credentialShape (stray quotes/whitespace, wrong length). Token refresh does not evaluate scopes, so this is not a scope problem.";
    case "invalid_client":
      return "Google does not recognize the OAuth client: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are wrong, mismatched, deleted, or corrupted (see credentialShape).";
    case "invalid_request":
      return "The token request was malformed or missing a field — often an empty or corrupted env value (see credentialShape).";
    case "unauthorized_client":
      return "This OAuth client is not authorized to use the refresh_token grant.";
    case "invalid_scope":
      return "Google reports an invalid scope on the token request.";
    default:
      return "Unrecognized token-endpoint response — see oauth for Google's status and fields.";
  }
}

export async function runGoogleValidateOnlyDiagnostic(): Promise<GoogleDiagnosticResult> {
  const env = readEnv();
  if (!isFullyConfigured(env)) {
    console.error(`${LOG} aborted: Google Ads credentials not fully configured`);
    return result({
      ok: false,
      httpStatus: 503,
      stage: "not_configured",
      message:
        "Google Ads credentials are not fully configured (GOOGLE_CLIENT_ID/SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_LOGIN_CUSTOMER_ID, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_CONVERSION_ACTION_ID). No request was sent to Google.",
    });
  }

  const ids = {
    customerId: env.customerId,
    loginCustomerId: env.loginCustomerId,
    conversionActionId: env.conversionActionId,
    expectedConversionActionId: EXPECTED_CONVERSION_ACTION_ID,
  };

  if (env.conversionActionId !== EXPECTED_CONVERSION_ACTION_ID) {
    console.error(
      `${LOG} aborted: GOOGLE_ADS_CONVERSION_ACTION_ID=${env.conversionActionId} does not match expected ${EXPECTED_CONVERSION_ACTION_ID}`,
    );
    return result({
      ok: false,
      httpStatus: 409,
      stage: "conversion_action_mismatch",
      message: `GOOGLE_ADS_CONVERSION_ACTION_ID is "${env.conversionActionId}", not the expected "${EXPECTED_CONVERSION_ACTION_ID}". Aborted — no request was sent to Google.`,
      ids,
    });
  }

  const token = await refreshAccessToken(env);
  if (!token.ok) {
    const { details } = token;
    const summary = details.networkError
      ? `network error: ${details.networkError}`
      : `HTTP ${details.httpStatus}${details.error ? ` ${details.error}` : ""}${
          details.errorDescription ? ` — ${details.errorDescription}` : ""
        }`;
    console.error(`${LOG} token refresh failed: ${summary}`);
    return result({
      ok: false,
      httpStatus: 502,
      stage: "token_refresh_failed",
      message: `OAuth token refresh failed (${summary}). No request was sent to the Data Manager API.`,
      oauth: details,
      credentialShape: describeCredentialShape(env),
      hint: hintFor(details),
      ids,
    });
  }
  const accessToken = token.accessToken;

  const request: IngestBody & { validateOnly: true } = {
    ...buildIngestBody(env, syntheticEvent()),
    validateOnly: true,
  };

  // Guard on the exact bytes that will be sent, not on the object we built.
  const serialized = JSON.stringify(request);
  if ((JSON.parse(serialized) as { validateOnly?: unknown }).validateOnly !== true) {
    throw new Error("Refusing to send: validateOnly is not true in the serialized request");
  }

  try {
    const res = await fetch(INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: serialized,
    });
    const googleResponse = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      console.error(
        `${LOG} Google rejected the request HTTP ${res.status}:`,
        JSON.stringify(googleResponse),
      );
      return result({
        ok: false,
        httpStatus: res.status >= 400 && res.status < 500 ? 422 : 502,
        stage: "google_rejected",
        message: `Google returned HTTP ${res.status} for the validate-only request. See googleResponse for the reason.`,
        ids,
        request,
        googleStatus: res.status,
        googleResponse,
      });
    }

    console.log(`${LOG} validated OK (HTTP ${res.status}):`, JSON.stringify(googleResponse));
    return result({
      ok: true,
      httpStatus: 200,
      stage: "validated",
      message:
        "Google accepted the request as valid: OAuth, scope and payload shape work. This does not prove a real gclid will match a click — that is only reported after a real ingest, via requestStatus.",
      ids,
      request,
      googleStatus: res.status,
      googleResponse,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Data Manager API request failed";
    console.error(`${LOG} request failed:`, message);
    return result({
      ok: false,
      httpStatus: 502,
      stage: "google_request_failed",
      message: `Could not reach the Data Manager API: ${message}`,
      ids,
      request,
    });
  }
}
