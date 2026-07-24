import type { PlatformAdapter } from "../types";
import { env } from "@/lib/env";

// Microsoft Advertising Offline Conversion Import.
//
// Requires an Azure AD OAuth2 app registration + the Bing Ads Bulk/Campaign
// Management API (a SOAP/REST hybrid with its own bulk-file upload format),
// none of which is wired up in this project yet. Same treatment as the Google
// adapter: the interface + configuration check are real; the actual upload
// call is the one isolated TODO, deliberately left for when credentials exist.
export const microsoftAdapter: PlatformAdapter = {
  platform: "MICROSOFT",

  isConfigured(): boolean {
    return Boolean(
      env.MICROSOFT_ADS_CLIENT_ID &&
      env.MICROSOFT_ADS_CLIENT_SECRET &&
      env.MICROSOFT_ADS_REFRESH_TOKEN &&
      env.MICROSOFT_ADS_DEVELOPER_TOKEN &&
      env.MICROSOFT_ADS_CUSTOMER_ID,
    );
  },

  async send(event) {
    if (!this.isConfigured()) {
      return { success: false, error: "Microsoft Ads credentials not configured" };
    }
    if (!event.attribution.msclkid) {
      return { success: false, error: "No msclkid on this conversion" };
    }

    // TODO: exchange MICROSOFT_ADS_REFRESH_TOKEN for an access token, then
    // submit an offline conversion via the Bulk/Campaign Management API with:
    //   MicrosoftClickId: event.attribution.msclkid,
    //   ConversionTime: event.conversionTime, ConversionValue: event.conversionValue,
    //   CurrencyCode: event.currency
    return {
      success: false,
      error: "Microsoft Ads adapter not yet wired to the Offline Conversion API",
    };
  },
};
