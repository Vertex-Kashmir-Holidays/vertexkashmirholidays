import crypto from "crypto";
import type { PlatformAdapter } from "../types";
import { env } from "@/lib/env";

// Meta Conversions API — https://developers.facebook.com/docs/marketing-api/conversions-api
// A plain REST POST; no SDK dependency needed.
const API_VERSION = "v19.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export const metaAdapter: PlatformAdapter = {
  platform: "META",

  isConfigured(): boolean {
    return Boolean(env.META_CAPI_PIXEL_ID && env.META_CAPI_ACCESS_TOKEN);
  },

  async send(event) {
    const pixelId = env.META_CAPI_PIXEL_ID;
    const accessToken = env.META_CAPI_ACCESS_TOKEN;
    if (!pixelId || !accessToken) {
      return { success: false, error: "META_CAPI_PIXEL_ID/META_CAPI_ACCESS_TOKEN not configured" };
    }

    const userData: Record<string, unknown> = {};
    if (event.email) userData.em = [sha256(event.email)];
    if (event.phone) userData.ph = [sha256(event.phone.replace(/[^\d]/g, ""))];
    if (event.ipAddress) userData.client_ip_address = event.ipAddress;
    if (event.userAgent) userData.client_user_agent = event.userAgent;
    // fbc is Meta's own click-id cookie format ("fb.1.<ts>.<fbclid>"); we only
    // have the raw fbclid, so pass it through fbc using the documented prefix.
    if (event.attribution.fbclid) {
      userData.fbc = `fb.1.${Math.floor(event.conversionTime.getTime() / 1000)}.${event.attribution.fbclid}`;
    }

    const body: Record<string, unknown> = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(event.conversionTime.getTime() / 1000),
          action_source: "website",
          user_data: userData,
          custom_data: {
            value: event.conversionValue ?? 0,
            currency: event.currency,
          },
        },
      ],
    };
    // Set only while actively testing in Events Manager's Test Events tab —
    // Meta excludes test_event_code-tagged events from real reporting/optimization.
    if (env.META_CAPI_TEST_EVENT_CODE) {
      body.test_event_code = env.META_CAPI_TEST_EVENT_CODE;
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        return { success: false, response: json, error: `Meta CAPI returned ${res.status}` };
      }
      return { success: true, response: json };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Meta CAPI request failed" };
    }
  },
};
