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
 | "booking_help";


export type AnalyticsEvent =
 | { event: "lead_submit"; lead_type: LeadType }
 | { event: "whatsapp_click"; source: WhatsAppSource }
 | { event: "phone_click" }
 | { event: "email_click" }
 | { event: "package_view"; package_name: string }
 | { event: "inquiry_started"; tour_name?: string }
 | { event: "booking_started"; package_name?: string };


// Extend the global Window type so dataLayer is typed everywhere.
declare global {
 interface Window {
   dataLayer: Record<string, unknown>[];
 }
}
