# Analytics — GTM + GA4


## Architecture


All tracking flows through a single pipeline:


```
Website (dataLayer.push) → GTM Container → GA4 Property
```


Never call `gtag()` directly. GTM is the single source of truth for tag configuration — GA4, conversion pixels, etc. are all configured there, not in code.


## Environment variables


| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_GTM_ID` | `GTM-THKWZ8Q8` | Required. Leave blank to disable. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-GJW3W57Z8S` | Configure inside GTM, not in code. |


## Utility functions


`src/lib/analytics.ts` — all functions guard against SSR and log in `development` mode.


| Function | Event name | When to call |
|---|---|---|
| `trackLeadSubmit(leadType)` | `lead_submit` | After lead/contact form POST succeeds |
| `trackWhatsappClick(source)` | `whatsapp_click` | When any WhatsApp CTA is clicked |
| `trackPhoneClick()` | `phone_click` | When a `tel:` link is clicked |
| `trackEmailClick()` | `email_click` | When a `mailto:` link is clicked |
| `trackPackageView(name)` | `package_view` | On tour/package detail page load |
| `trackTourInquiry(tourName?)` | `inquiry_started` | When inquiry modal/tab opens |
| `trackBookingStarted(name?)` | `booking_started` | When user initiates checkout |


## WhatsApp sources


| Source value | Where |
|---|---|
| `header` | Desktop Navbar "Plan My Trip" |
| `header_mobile` | Mobile FAB (floating action button) |
| `footer_cta` | Footer "Plan My Trip Free →" CTA |
| `footer_social` | Footer social icon row WhatsApp button |
| `float` | `ContactWhatsAppFloat` (bottom-right bubble) |
| `tour_sidebar` | Tour detail page "Need Help?" sidebar card |
| `booking_help` | (reserved for BookingForm help link) |


## Instrumented touchpoints


- `src/app/layout.tsx` — GTM script + noscript iframe
- `src/components/leads/LeadForm.tsx` — `trackLeadSubmit` after success
- `src/components/contact/ContactForm.tsx` — `trackLeadSubmit("contact")` after success
- `src/components/layout/Navbar.tsx` — `trackWhatsappClick` on desktop + mobile WA links
- `src/components/layout/Footer.tsx` — WA CTA, WA social icon, phone, email
- `src/components/contact/ContactWhatsAppFloat.tsx` — float bubble click
- `src/components/tours/TourDetailsSidebar.tsx` — "Need Help?" WA, inquiry tab, booking button
- `src/components/tours/BookingMobileBar.tsx` — inquiry and book buttons
- `src/app/(public)/tours/[slug]/page.tsx` — `PackageViewTracker` client component on mount


## Adding a new event


1. Add the event shape to the `AnalyticsEvent` union in `src/types/analytics.ts`
2. Add a helper function in `src/lib/analytics.ts`
3. Call the helper from the component — never push raw objects to `dataLayer`
4. Configure a corresponding GTM trigger + tag in the GTM UI


## Debug


In development (`NODE_ENV=development`), every `push()` call logs to the browser console:
```
[Analytics] { event: "whatsapp_click", source: "header" }
```


Use the GTM Preview mode in the GTM web UI to verify events in production.
