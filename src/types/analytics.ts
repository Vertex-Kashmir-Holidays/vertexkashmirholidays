// Strict event types for all dataLayer pushes flowing to GTM → GA4.
// Every event shape is a discriminated union — never use `any` or free-form objects.

export type LeadType = "itinerary" | "contact" | "tour_inquiry";

export type WhatsAppSource =
  | "header"
  | "header_mobile"
  | "footer_cta"
  | "footer_social"
  | "float"
  | "tour_sidebar"
  | "tour_customize_banner"
  | "booking_help"
  | "lead_form";

export type AnalyticsEvent =
  | { event: "lead_submit"; lead_type: LeadType; package_name?: string }
  | { event: "whatsapp_click"; source: WhatsAppSource }
  | { event: "phone_click" }
  | { event: "email_click" }
  | { event: "package_view"; package_name: string }
  | { event: "inquiry_started"; package_name?: string; tour_id?: string }
  | { event: "booking_started"; package_name?: string }
  | {
      event: "booking_completed";
      booking_id: string;
      value: number;
      currency: "INR";
      package_name: string;
      items: { item_name: string; price: number; quantity: number }[];
    };

// Extend the global Window type so dataLayer is typed everywhere.
// Optional modifier matches @next/third-parties/google ga.d.ts declaration
// (TS2687 requires identical modifiers across all Window interface merges).
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
