// Strict event types for all dataLayer pushes flowing to GTM → GA4.
// Every event shape is a discriminated union — never use `any` or free-form objects.

export type LeadType =
  | "itinerary"
  | "contact"
  | "tour_inquiry"
  | "flight_train_quote"
  | "trip_planner_request"
  | "occasion_offer";

export type WhatsAppSource =
  | "header"
  | "header_mobile"
  | "footer_cta"
  | "footer_social"
  | "float"
  | "tour_sidebar"
  | "tour_customize_banner"
  | "booking_help"
  | "lead_form"
  | "b2b_page"
  | "trip_planner_hotel_carousel"
  | "trip_planner_hero"
  | "trip_planner_closing_cta"
  | "tours_card"
  | "activities_card"
  | "tour_category_hero"
  | "promo_banner"
  | "strip_banner"
  | "tour_collection_hero"
  | "listing_hero"
  | "tour_package_card"
  | "offer_hero"
  | "offer_package_card"
  | "offer_mobile_bar"
  | "offer_closing_cta"
  | "destinations_cta"
  // CMS-authored "whatsapp:" CTA links (CmsCtaLink).
  | "home_hero"
  | "home_section_cta"
  | "about_hero"
  | "contact_social_cta";

// Trip Planner structured-intent params, reused by lead_submit/whatsapp_click/
// trip_request_start below — kept as plain string[]/string here (not imported
// from src/lib/leads/schema.ts) since this file has no other project imports
// and stays that way deliberately (see the module doc comment above).
interface TripPlannerIntentParams {
  requested_components?: string[];
  transport_modes?: string[];
  source_page?: string;
  has_tour_interest?: boolean;
  has_hotel_interest?: boolean;
}

// Selected Tour.packageOptions entry (e.g. "Premium") for tours sold as package
// variants — rides along on the existing inquiry/WhatsApp/lead events rather
// than a new event. package_name stays the TOUR title, as on every other event.
interface PackageOptionParams {
  package_option?: string;
}

// Occasion Offer page context (/diwali-kashmir-tour-package-2026, …) — rides
// along on lead_submit/whatsapp_click fired from an offer page; package_option
// (above) carries the chosen tier there.
interface OfferParams {
  offer_id?: string;
  offer_slug?: string;
}

export type AnalyticsEvent =
  | ({
      event: "lead_submit";
      lead_type: LeadType;
      package_name?: string;
      // The just-created Lead's own database id. GTM's Facebook Pixel Lead
      // tag (if/when configured to fire on this event) should map its
      // "Event ID" field to this dataLayer variable — that's what lets Meta
      // dedupe this browser event against the server-side Conversions API
      // call for the same Lead (see src/lib/offlineConversion/adapters/meta.ts).
      lead_id?: string;
    } & TripPlannerIntentParams &
      PackageOptionParams &
      OfferParams)
  | ({
      event: "whatsapp_click";
      source: WhatsAppSource;
      package_name?: string;
    } & TripPlannerIntentParams &
      PackageOptionParams &
      OfferParams)
  // Occasion Offer page load, and a stay tier being picked on it.
  | { event: "offer_view"; offer_id: string; offer_slug: string; occasion_type: string }
  | { event: "offer_package_select"; offer_id: string; offer_slug: string; package_option: string }
  // Fires once, on the Trip Planner's first chip interaction — never on every
  // page view. entry_intent reflects whatever the entry point (this page's
  // hub form vs. a tour page's pre-set chip) started the visitor with.
  | { event: "trip_request_start"; entry_intent?: string[]; source_page: string }
  | { event: "phone_click" }
  | { event: "email_click" }
  | { event: "package_view"; package_name: string }
  | ({ event: "inquiry_started"; package_name?: string; tour_id?: string } & PackageOptionParams)
  | { event: "flight_train_quote_click"; package_name?: string; placement: string }
  | { event: "booking_started"; package_name?: string }
  | {
      event: "booking_completed";
      booking_id: string;
      value: number;
      currency: "INR";
      package_name: string;
      items: { item_name: string; price: number; quantity: number }[];
    }
  | { event: "b2b_registration_started" }
  | { event: "b2b_registration_submitted" }
  | { event: "careers_viewed" }
  | { event: "job_viewed"; job_title: string; job_id: string }
  | { event: "apply_started"; job_title: string; job_id: string }
  | { event: "otp_requested"; job_id: string }
  | { event: "otp_verified"; job_id: string }
  | { event: "application_submitted"; job_title: string; job_id: string };

// Extend the global Window type so dataLayer is typed everywhere.
// Optional modifier matches @next/third-parties/google ga.d.ts declaration
// (TS2687 requires identical modifiers across all Window interface merges).
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
