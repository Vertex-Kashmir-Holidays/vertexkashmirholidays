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

import type { ConversionEvent } from "./types";
import {
  INGEST_URL,
  buildIngestBody,
  getAccessToken,
  isFullyConfigured,
  readEnv,
  type IngestBody,
} from "./adapters/google";

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

export interface GoogleDiagnosticResult {
  ok: boolean;
  /** HTTP status the route should respond with. */
  httpStatus: number;
  stage: DiagnosticStage;
  message: string;
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

  let accessToken: string;
  try {
    accessToken = await getAccessToken(env);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google token refresh failed";
    console.error(`${LOG} token refresh failed:`, message);
    return result({
      ok: false,
      httpStatus: 502,
      stage: "token_refresh_failed",
      message: `OAuth token refresh failed: ${message}. No request was sent to the Data Manager API.`,
      ids,
    });
  }

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
