// One-time script to obtain a Google Ads API refresh token using the same
// OAuth client already registered for future Google Login (GOOGLE_CLIENT_ID /
// GOOGLE_CLIENT_SECRET). Run once; paste the printed token into .env.local as
// GOOGLE_ADS_REFRESH_TOKEN.
//
// Usage:
//   yarn google-ads:refresh-token
//
// Stop `next dev` first — this needs port 3000 free to catch the OAuth
// redirect at the exact URI already registered in Google Cloud Console:
//   http://localhost:3000/api/auth/callback/google

import { createServer } from "node:http";
import { exec } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// ── tiny .env loader (no dotenv dependency) ──────────────────────────────────
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
const REDIRECT_URI = "http://localhost:3000/api/auth/callback/google";
// Data Manager API requires its own scope; adwords is included too since our
// destination is a Google Ads account (matches Google's own documented
// combined-scope example for exactly this scenario — see
// developers.google.com/data-manager/api/devguides/quickstart/set-up-access).
// Space-separated, per the OAuth "scope" URL parameter spec (NOT the comma
// syntax used by gcloud's --scopes flag).
const SCOPE = "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/datamanager";
const PORT = 3000;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env.local — set these first (same OAuth client already registered in Google Cloud Console).",
  );
  process.exit(1);
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? `open "${url}"` : process.platform === "win32" ? `start "" "${url}"` : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.log("Could not auto-open a browser. Open this URL manually:\n" + url);
  });
}

function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent", // forces a refresh_token even if this account consented before
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCode(code: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const json = (await res.json().catch(() => null)) as
    | { refresh_token?: string; error?: string; error_description?: string }
    | null;

  if (!res.ok || !json?.refresh_token) {
    throw new Error(
      json?.error_description ??
        json?.error ??
        `Token exchange failed (${res.status}). If refresh_token is missing, revoke prior access at ` +
          "https://myaccount.google.com/permissions and re-run this script (prompt=consent should prevent this, but a stale grant can still skip it).",
    );
  }
  return json.refresh_token;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  if (url.pathname !== "/api/auth/callback/google") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html" }).end(`<h1>Authorization failed</h1><p>${error}</p>`);
    console.error(`Google returned an error: ${error}`);
    server.close(() => process.exit(1));
    return;
  }

  if (!code) {
    res.writeHead(400).end("Missing authorization code");
    return;
  }

  exchangeCode(code)
    .then((refreshToken) => {
      res
        .writeHead(200, { "Content-Type": "text/html" })
        .end("<h1>Success</h1><p>Refresh token printed to your terminal. You can close this tab.</p>");
      console.log("\nGOOGLE_ADS_REFRESH_TOKEN generated. Add this to .env.local:\n");
      console.log(`GOOGLE_ADS_REFRESH_TOKEN="${refreshToken}"\n`);
    })
    .catch((err) => {
      res.writeHead(500, { "Content-Type": "text/html" }).end("<h1>Token exchange failed</h1>");
      console.error(err instanceof Error ? err.message : err);
    })
    .finally(() => {
      server.close(() => process.exit(0));
    });
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use — stop \`next dev\` (or anything else on :${PORT}) and re-run this script.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  const authUrl = buildAuthUrl();
  console.log("Opening browser for Google Ads API consent...\n");
  console.log("If it doesn't open automatically, visit:\n" + authUrl + "\n");
  openBrowser(authUrl);
});
