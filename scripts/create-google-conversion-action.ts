// One-time setup script — creates a Google Ads conversion action (type
// UPLOAD_CLICKS) via the Google Ads API's ConversionActionService, and prints
// its numeric ID for use as GOOGLE_ADS_CONVERSION_ACTION_ID.
//
// This is a genuinely different API surface than the runtime adapter
// (src/lib/offlineConversion/adapters/google.ts), which only ever calls the
// Data Manager API's events:ingest — that call ignores headers entirely.
// This script instead calls the classic Google Ads API directly (REST), which
// DOES require the full header set (developer-token, login-customer-id) —
// confirmed still valid post-2026-06-15 because ConversionActionService
// (creating the conversion action resource) is a separate service from the
// now-deprecated ConversionUploadService (uploading individual conversions).
//
// Makes no changes to the offline conversion adapter, service, or queue —
// this only creates one account-level resource in Google Ads, once.
//
// Usage:
//   yarn google-ads:create-conversion-action ["Conversion action name"]

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// ── tiny .env loader (same as generate-google-ads-refresh-token.ts, no dotenv dependency) ──
function loadEnvFile(file: string): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN;
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;

const API_VERSION = "v24"; // current stable as of July 2026 — see developers.google.com/google-ads/api/docs/sunset-dates

const missing = Object.entries({
  GOOGLE_CLIENT_ID: CLIENT_ID,
  GOOGLE_CLIENT_SECRET: CLIENT_SECRET,
  GOOGLE_ADS_REFRESH_TOKEN: REFRESH_TOKEN,
  GOOGLE_ADS_DEVELOPER_TOKEN: DEVELOPER_TOKEN,
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: LOGIN_CUSTOMER_ID,
  GOOGLE_ADS_CUSTOMER_ID: CUSTOMER_ID,
})
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0) {
  console.error(`Missing required env var(s) in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

// Google Ads ids are digits only — accept values with or without the dashes
// Google's own UI displays them with (e.g. "591-050-4339").
function digitsOnly(id: string): string {
  return id.replace(/[^\d]/g, "");
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token: REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json().catch(() => null)) as
    | { access_token?: string; error?: string; error_description?: string }
    | null;
  if (!res.ok || !json?.access_token) {
    throw new Error(json?.error_description ?? json?.error ?? `Token refresh failed (${res.status})`);
  }
  return json.access_token;
}

interface MutateConversionActionsResponse {
  results?: { resourceName?: string }[];
}

async function createConversionAction(accessToken: string, name: string): Promise<MutateConversionActionsResponse> {
  const customerId = digitsOnly(CUSTOMER_ID!);
  const loginCustomerId = digitsOnly(LOGIN_CUSTOMER_ID!);

  const res = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/conversionActions:mutate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "developer-token": DEVELOPER_TOKEN!,
      "login-customer-id": loginCustomerId,
    },
    body: JSON.stringify({
      operations: [
        {
          create: {
            name,
            type: "UPLOAD_CLICKS",
            category: "DEFAULT",
            status: "ENABLED",
            viewThroughLookbackWindowDays: 15,
            valueSettings: { defaultValue: 0, alwaysUseDefaultValue: false },
          },
        },
      ],
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Google Ads API returned ${res.status}: ${JSON.stringify(json)}`);
  }
  return json as MutateConversionActionsResponse;
}

async function main() {
  const name = process.argv[2] ?? "Vertex Kashmir Holidays — Qualified Lead";

  console.log(`Creating UPLOAD_CLICKS conversion action "${name}" on customer ${CUSTOMER_ID}...`);

  const accessToken = await getAccessToken();
  const response = await createConversionAction(accessToken, name);

  const resourceName = response.results?.[0]?.resourceName;
  if (!resourceName) {
    console.error("No resourceName returned — full response:", JSON.stringify(response, null, 2));
    process.exit(1);
  }

  const id = resourceName.split("/").pop();

  console.log(`\nCreated: ${resourceName}`);
  console.log(`\nAdd this to .env.local:\n`);
  console.log(`GOOGLE_ADS_CONVERSION_ACTION_ID="${id}"\n`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
