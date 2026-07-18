// Server-only Offline Conversions helpers — split out of ./offlineConversions
// because that file is imported by client components (OfflineConversionsClient,
// OfflineConversionDetail) for its pure display/formatting exports. Both
// functions here need `env` (secrets) or make a real network call with OAuth
// credentials, so they must never be reachable from a client bundle — `env`
// throws immediately on import if a required var is missing, which happens
// harmlessly server-side but breaks the page in the browser if this ever
// gets bundled client-side (process.env secrets are never available there).
import type { OfflineConversionPlatform } from "@prisma/client";
import { checkGoogleRequestStatus, type RequestStatusResult } from "@/lib/admin/googleRequestStatus";
import { PLATFORM_LABELS } from "@/lib/admin/offlineConversions";
import { env } from "@/lib/env";

/**
 * The identifier each platform's conversion was sent against — Google's
 * conversion action ID today, a Meta Pixel ID tomorrow, etc. Each platform's
 * adapter owns its own env var; this only reads it for display, exactly the
 * way the adapters already do — no new config, no adapter changes.
 */
export function getPlatformDestinationId(platform: OfflineConversionPlatform): string | null {
  switch (platform) {
    case "GOOGLE":
      return env.GOOGLE_ADS_CONVERSION_ACTION_ID || null;
    case "META":
      return env.META_CAPI_PIXEL_ID || null;
    case "MICROSOFT":
      return env.MICROSOFT_ADS_CONVERSION_ID || null;
    default:
      return null;
  }
}

/**
 * Dispatches to the platform's own read-only status-check API, if one
 * exists. Purely diagnostic — never mutates the queue row. Only Google is
 * wired today (Meta/Microsoft have no equivalent request-status endpoint
 * integrated yet); adding one later is a new case here, not a UI change.
 */
export async function checkRequestStatus(
  platform: OfflineConversionPlatform,
  requestId: string,
): Promise<RequestStatusResult> {
  if (platform === "GOOGLE") return checkGoogleRequestStatus(requestId);
  return {
    ok: false,
    status: "ERROR",
    message: `Live status checks aren't available for ${PLATFORM_LABELS[platform]} yet.`,
  };
}
