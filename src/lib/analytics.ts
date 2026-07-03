// Analytics utility — all tracking must flow: site → dataLayer → GTM → GA4.
// Never call gtag() directly; always push structured events to dataLayer so GTM
// remains the single source of truth for tag configuration.
//
// All functions guard against SSR (window check) and log in dev mode.


import type { AnalyticsEvent, LeadType, WhatsAppSource } from "@/types/analytics";


function push(payload: AnalyticsEvent): void {
 if (typeof window === "undefined") return;
 window.dataLayer = window.dataLayer || [];
 window.dataLayer.push(payload as unknown as Record<string, unknown>);
 if (process.env.NODE_ENV === "development") {
   // eslint-disable-next-line no-console
   console.log("[Analytics]", payload);
 }
}


/** Fire after a lead form submits successfully — never on validation errors. */
export function trackLeadSubmit(leadType: LeadType = "itinerary", tourName?: string): void {
 push({ event: "lead_submit", lead_type: leadType, ...(tourName ? { package_name: tourName } : {}) });
}


/** Fire when any WhatsApp CTA is clicked. */
export function trackWhatsappClick(source: WhatsAppSource): void {
 push({ event: "whatsapp_click", source });
}


/** Fire when a tel: link is clicked. */
export function trackPhoneClick(): void {
 push({ event: "phone_click" });
}


/** Fire when a mailto: link is clicked. */
export function trackEmailClick(): void {
 push({ event: "email_click" });
}


/** Fire when a tour/package detail page loads. */
export function trackPackageView(packageName: string): void {
 push({ event: "package_view", package_name: packageName });
}


/** Fire when a user opens an inquiry modal / form tab. */
export function trackTourInquiry(tourName?: string, tourId?: string): void {
 push({
   event: "inquiry_started",
   ...(tourName ? { package_name: tourName } : {}),
   ...(tourId  ? { tour_id:   tourId   } : {}),
 });
}


/** Fire when a user initiates the booking checkout flow. */
export function trackBookingStarted(packageName?: string): void {
 push({ event: "booking_started", ...(packageName ? { package_name: packageName } : {}) });
}

/** Fire once on the booking success page after payment is confirmed. */
export function trackBookingCompleted(bookingId: string, value: number, packageName: string): void {
 push({
   event: "booking_completed",
   booking_id: bookingId,
   value,
   currency: "INR",
   package_name: packageName,
   items: [{ item_name: packageName, price: value, quantity: 1 }],
 });
}
