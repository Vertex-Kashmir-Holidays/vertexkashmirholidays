import type { PlatformAdapter } from "../types";

// Google Ads Offline Conversion Import.
//
// Unlike Meta's Conversions API, Google Ads' conversion upload is not a single
// plain REST call — it requires an OAuth2 refresh-token exchange plus the
// Google Ads API (gRPC/REST via the `google-ads-api` package, not currently a
// dependency of this project) with a developer token + login-customer-id.
// Wiring the actual upload is intentionally left as the one isolated TODO
// below — the queue/service/retry/dedup machinery around it is already
// complete and does not need to change when this is filled in.
export const googleAdapter: PlatformAdapter = {
  platform: "GOOGLE",

  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
        process.env.GOOGLE_ADS_CLIENT_ID &&
        process.env.GOOGLE_ADS_CLIENT_SECRET &&
        process.env.GOOGLE_ADS_REFRESH_TOKEN &&
        process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    );
  },

  async send(event) {
    if (!this.isConfigured()) {
      return { success: false, error: "Google Ads credentials not configured" };
    }
    const clickId = event.attribution.gclid ?? event.attribution.gbraid ?? event.attribution.wbraid;
    if (!clickId) {
      return { success: false, error: "No gclid/gbraid/wbraid on this conversion" };
    }

    // TODO: exchange GOOGLE_ADS_REFRESH_TOKEN for an access token, then call
    // ConversionUploadService.UploadClickConversions with:
    //   conversion_action, gclid: clickId, conversion_date_time: event.conversionTime,
    //   conversion_value: event.conversionValue, currency_code: event.currency
    return { success: false, error: "Google Ads adapter not yet wired to the Conversion Upload API" };
  },
};
