# Vertex Attribution & Conversion Audit — 2026-09-29

Scope: read-only audit of the `VERTEX-doc-links` working tree (HEAD `95193be` + ~157 uncommitted files), the live site HTML (fetched 2026-09-29), and the **live** database (`vertex` on heavencloud). All SQL ran with `default_transaction_read_only=on`, and no code or data was changed.

Notes on method:

- "Live" behaviour was checked against the served HTML. The deployed build includes the Trip Planner (commit `95193be`), so it matches HEAD for the files below unless stated otherwise. Where the uncommitted working tree differs from HEAD, this report says so.
- The GTM container, the Google Ads / Meta UIs and the Vercel production env vars are **outside this repo**. Anything that depends on them is marked NOT FOUND (in repo).
- The CRM's lead statuses differ from the list in the brief. The real enum (`prisma/schema.prisma`, `enum LeadStatus`) is `NEW, CONNECTED, NOT_CONNECTED, QUALIFIED, NEGOTIATION, ON_HOLD, IN_PROGRESS, CONVERTED, REJECTED`. `CONTACTED`, `PROPOSAL_SENT` and `NOT_REACHED` do not exist.

---

## 1. Executive summary

- **The offline-conversion pipeline has never sent anything.** `OfflineConversion` has **0 rows, ever**. Every CONVERTED lead in the last 60 days, including all 3 September bookings, has no gclid/fbclid. The enqueue step therefore returns early and no row is created (`src/lib/offlineConversion/service.ts:50-51`). Google and Meta get no booking signal from the CRM.
- **WhatsApp refs are created at scale but almost never used.** 918 attribution tokens have been minted since 2026-08-14 (516 Google, 267 Meta-fbclid). Only **10 were ever resolved**, 0 of them Meta. Resolution happens only if a salesperson pastes the ref into the admin "New Lead" form (`src/app/api/admin/leads/route.ts:110-111`). All 25 META_ADS leads in the last 60 days were tagged by hand and have no fbclid, so Meta CAPI can never fire for them.
- **The `/tours` hero CTA is broken, and it also carries a stale test ref.** The CMS row `HomeSection.toursHero.ctaHref` stores a pre-encoded message, not a URL, and that message has `[Ref: G-DMt0jGlk]` hard-coded into it. That token is a **test token** (`utmCampaign = test-whatsapp-attribution`, no gclid, expires 2026-10-16). The deployed `ListingHero` renders the value raw (`HEAD:src/components/layout/ListingHero.tsx:93`), so the browser resolves it relative to the site domain.
- **Google Ads' "form" conversions do not match the CRM.** Only **3 website-form leads** exist in the last 60 days (1 from Google). Google reports 9 form conversions in 13 days. Whatever GTM is counting is not `lead_submit` → Lead row. The GTM config is not in the repo and needs checking there.
- **Consent gating is switched off in production.** A "TEMP (2–3 day measurement test)" flag, `TEMP_CONSENT_GATE_DISABLED = true`, was committed on 2026-09-21 (`src/lib/cookieConsent.ts:14-15`). While it is on, attribution capture and GTM work for everyone. Reverting it brings back a hard GTM block with no Consent Mode v2. That would drop Ads/GA4/Pixel signal for every visitor who doesn't click "Accept".

## 2. What is working

- **Click-ID / UTM capture on every page.** `<AttributionCapture />` is mounted in the root layout (`src/app/layout.tsx:100`). It captures `gclid, gbraid, wbraid, fbclid, msclkid, utm_*`, the landing page and the referrer (`src/lib/attribution.ts:14-27, 94-102`).
  - It writes a 90-day first-touch cookie `vkh_attribution` (`src/lib/attribution.ts:91-92, 299-302`).
  - It also writes a 60-minute pre-consent localStorage buffer (`src/lib/attribution.ts:190-195, 244-265`).
  - Click IDs can still be filled in later if they are empty (`fillEmpty`, `src/lib/attribution.ts:139-152`).
- **Attribution survives navigation, refresh and return visits.** The cookie is `path=/`, `max-age` 90 days and `SameSite=Lax`, and it is read fresh on every use. Client-side navigation doesn't remount the root layout, but nothing needs re-capturing, because the cookie already holds the landing-page values.
- **Q5 trace, `/tours?gclid=X` → `/plan-your-kashmir-trip` → WhatsApp: the GCLID is preserved.**
  1. On the landing load, `bufferAttributionRaw()` stores X. Then `captureAttributionClient()` writes the cookie; consent is currently forced on (`src/lib/cookieConsent.ts:25-27`). Then `ensureWhatsAppAttributionToken()` POSTs to `/api/attribution/token`, which creates a `WhatsAppAttributionToken` row and caches `{token, prefix:"G"}` in the `vkh_wa_token` cookie (`src/lib/attribution.ts:483-531`, `src/app/api/attribution/token/route.ts:97-103`).
  2. On `/plan-your-kashmir-trip`, `TripPlannerForm` calls `ensureWhatsAppAttributionToken({requestedComponents, fromCity})` (`src/components/leads/TripPlannerForm.tsx:67`). This creates a second token with the same gclid plus the planner intent.
  3. The WhatsApp CTA's href is built by `useWhatsAppLink()` (`src/components/providers/SiteSettingsProvider.tsx:55-63`). That appends `[Ref: G-xxxxxxxx]` (`src/lib/whatsapp.ts:38-53`) and re-renders when the token cookie changes (`src/lib/useWhatsAppAttributionTag.ts:24-26`).
- **Token design is sound.** It is 8 base64url characters with 48 bits of entropy, a 30-day TTL and a display prefix G/M/W derived from `deriveChannel()` (`src/lib/whatsappAttribution.server.ts:27-51`, `src/app/api/attribution/token/route.ts:35-39`). Resolution re-derives the channel on the server and marks the token consumed inside the lead-create transaction (`src/app/api/admin/leads/route.ts:110-176`).
- **Website form leads carry attribution.** `readAttributionForSubmit()` sends cookie values, plus click IDs from the buffer, with every LeadForm POST (`src/components/leads/LeadForm.tsx:180`). The server derives `source` from the click IDs (`src/lib/attribution.server.ts:16-49`).
- **Client events all go through one `dataLayer.push()`.** No `gtag()` or `fbq()` calls are made directly (`src/lib/analytics.ts:1-24`), and events are suppressed on admin routes (`src/lib/analytics.ts:16`).
- **Offline-conversion adapters exist and look well-formed.**
  - Google uses the Data Manager API `events:ingest`, sends gclid/gbraid/wbraid plus SHA-256 email/phone, and uses the queue row id as `transactionId` (`src/lib/offlineConversion/adapters/google.ts:137-172`).
  - Meta CAPI sends `Purchase` with hashed em/ph, IP, UA and `fbc` (`src/lib/offlineConversion/adapters/meta.ts:27-51`).
  - All credential env vars are set in local `.env`/`.env.local`. Production values could not be verified.

## 3. What is broken

**B1 — `/tours` hero CTA points at the site domain and carries a hard-coded test ref.**

- Data: `HomeSection` where `key='toursHero'` has `ctaHref = "Hi%20Vertex%20Kashmir%20Holidays!%20I'd%20like%20to%20plan%20my%20Kashmir%20trip.%20Please%20help%20me%20build%20a%20custom%20itinerary.%0A%0A%5BRef%3A%20G-DMt0jGlk%5D"` (last updated 2026-09-24 15:27).
- Code (deployed): `HEAD:src/components/layout/ListingHero.tsx:46, 93` passes `heading.ctaHref` straight to `<Link href>`. A value with no scheme is resolved relative to the page, which gives `https://vertexkashmirholidays.com/Hi%20Vertex…`. Confirmed in live `/tours` HTML.
- The uncommitted fix (`src/components/layout/ListingHero.tsx:49-55`) only handles values prefixed `whatsapp:`. **The current DB value has no prefix, so the link stays broken even after that code ships.** The value needs to become `whatsapp:<plain message>` with no ref.
- `G-DMt0jGlk` is token `DMt0jGlk`, created 2026-09-16 with `utmCampaign='test-whatsapp-attribution'` and no gclid. Every visitor would send the same test ref, so any lead resolved from it would be credited to a test campaign. The token expires 2026-10-16.
- Impact: the primary CTA on the main listing page is a dead link for every visitor. This is the "[Ref: G-DMt0jGlk]" seen on `/tours`: it's baked into the CMS, not generated per visitor.

**B2 — The offline conversion pipeline can never fire for the leads that actually book.**

- `enqueueForLead()` exits when a lead has no gclid/gbraid/wbraid/fbclid (`src/lib/offlineConversion/service.ts:27-33, 50-51`). The Google adapter also refuses events with no click ID (`src/lib/offlineConversion/adapters/google.ts:190-193`), so hashed phone/email alone (Enhanced Conversions for Leads) is never used as a fallback.
- All 4 CONVERTED leads in the last 60 days have no click ID.
- Impact: zero booking-level signal to Google or Meta, so bidding optimises only on on-site events.

**B3 — WhatsApp leads are created without their ref.**

- The ref can only be attached when a lead is *created* through the admin form (`whatsappReference`, `src/app/api/admin/leads/route.ts:43, 110-111`). There is no field for it when editing a lead, and nothing parses the ref automatically (see §4).
- In the last 60 days, 29 of 35 B2C leads have `sourcePage` NULL, meaning they were created by staff without a ref. 25 of those are labelled `META_ADS` by hand, with no fbclid or UTM.
- Impact: Meta and Google WhatsApp leads look identical to organic leads in the CRM, and the 80% WhatsApp path is effectively unattributed.

**B4 — Google Ads conversion count doesn't match CRM form leads.**

- In the last 60 days, `/api/leads` created only 3 leads: 2× `home` (utm_source chatgpt.com) and 1× `trip-planner` (Google, gbraid, 2026-09-29).
- `lead_submit` fires only after a 2xx response (`src/components/leads/LeadForm.tsx:196-232`). Bot-blocked requests return 400 (`src/app/api/leads/route.ts:266-267`), so they don't inflate the count.
- Impact: the "form submission" conversion in Google Ads (9 in 13 days) is triggered by something other than a real lead, for example a generic GTM form-submit trigger or `trip_request_start`. Google is bidding toward a false signal. This needs checking in GTM (NOT FOUND in repo).

**B5 — Consent gate is disabled in production.**

- `src/lib/cookieConsent.ts:14-15, 25-27` sets `TEMP_CONSENT_GATE_DISABLED = true`, committed in `a1619e5` on 2026-09-21. It is labelled a "2–3 day" test and has now been on for 8 days.
- Impact: this is a compliance risk. When it's reverted, `GTMScript` goes back to not loading GTM at all without consent (`src/components/providers/GTMScript.tsx:16-36`), and there is no Consent Mode v2 (`ad_storage`/`ad_user_data` are NOT FOUND in the repo). The Google tag also only sees the gclid in the URL on the landing pageview. If consent is given on a later page, GTM loads after the gclid is gone from the URL, so the Ads conversion linker never sets `_gcl_aw`.

**B6 — Several WhatsApp CTAs don't fire `whatsapp_click`.**

- `TourCard.tsx:237-250`, `ActivityCard.tsx:100-108`, `TourDetailsRelatedTours.tsx:90`, `AnnouncementModal.tsx:195`, `ContactForm.tsx:272`, `AboutCTA.tsx:52` and `BookingForm.tsx:766` all lack it.
- Impact: tour cards are the most-used WhatsApp CTA on `/tours` and the homepage, and clicks there aren't counted anywhere.

**B7 — Meta CAPI is misconfigured for deduplication and possibly for test mode.**

- There is no `event_id` on any Pixel event or CAPI event (NOT FOUND in `src/lib/analytics.ts`, `src/types/analytics.ts`, `src/lib/offlineConversion/**`).
- `META_CAPI_TEST_EVENT_CODE` is set in local `.env`. If it is also set in Vercel production, every CAPI event is excluded from reporting (`src/lib/offlineConversion/adapters/meta.ts:54-56`).
- `fbc` uses the conversion time instead of the click time (`meta.ts:35`), and `action_source` is `"website"` for sales-assisted conversions (`meta.ts:43`).
- Impact: not active today, because nothing is sent (B2). It will matter once the pipeline starts sending.

**B8 — No retry for failed offline conversions.**

- `vercel.json` registers only `connect-retention`. The route `src/app/api/cron/offline-conversions` exists but isn't scheduled (`service.ts:41-46, 233-237`).
- Impact: a row that fails once stays FAILED until someone clicks Retry in the admin.

**B9 — Tour duration and slug mismatches (see §7).**

- `durationLabel` is computed as `${duration-1}N / ${duration}D` at `src/app/(public)/tours/page.tsx:133` and `src/app/(public)/plan-your-kashmir-trip/page.tsx:197`.

**B10 — `/destinations` dead links (see §7).**

**B11 — Package minimum passengers blocks couples.**

- The Budget tour card shows "₹11,999 per person (min 4 pax)". Online checkout rejects bookings below `minPersons` (`src/app/api/bookings/create-order/route.ts:176-179`), and there is no per-pax pricing model in the schema.
- Impact: a couple sees a price they can't buy (see §7 Q34).

## 4. What is missing

- **No inbound WhatsApp handling at all.** No webhook, WhatsApp Business/Cloud API or Interakt/WATI integration exists. The only webhook is Razorpay (`src/app/api/bookings/webhook/route.ts`). Resolving a ref is fully manual (paste into New Lead). It works end to end only when staff paste the ref: 10 of 918 tokens so far (§5).
- **No WhatsApp-lead conversion to Google Ads.** `whatsapp_click` is only a `dataLayer` push (`src/lib/analytics.ts:93-107`). Whether GTM forwards it to Ads is NOT FOUND (in repo).
- **No Google Ads conversion IDs or labels in code.** Client conversions live in GTM (NOT FOUND in repo). Server-side there is one action, `GOOGLE_ADS_CONVERSION_ACTION_ID` (env, value set locally, production unknown), used as `productDestinationId` (`google.ts:147`).
- **No qualified-lead conversion.** The only server-side trigger is CONVERTED (lead convert, `src/app/api/leads/[id]/convert/route.ts:144`) or a paid website booking (`src/lib/bookings/notify.tsx:214`). Nothing fires on QUALIFIED, and only 1 lead reached QUALIFIED in 60 days.
- **No Enhanced Conversions for Leads fallback.** Hashed phone/email is sent only alongside a click ID (B2).
- **No profit value.** The conversion value is the gross booking amount (`lead.negotiatedAmount`, set to `bookingAmount` at `src/lib/bookings/convertLead.ts:158`; `booking.amount` for direct bookings, `service.ts:136, 154`). No margin or gross-profit field is sent.
- **No per-lead creator.** `Lead.createdById` is NULL on all 36 leads in the last 60 days, so staff-entered and form leads can only be told apart by `sourcePage`.
- **Events that don't exist:** `form_start` (closest is `trip_request_start`, `src/components/leads/TripPlannerForm.tsx:74`), `payment_success` (closest is `booking_completed`), and `phone_call_click` (the event is `phone_click`, only fired from `Footer.tsx:399`). `tel:` links in `ContactOfficeMap.tsx:58`, `CampaignNav.tsx:42`, `CampaignFinalCTA.tsx:71` and the B2B page `:956` are not tracked.

**Section C — event inventory (Q12–Q15).** All events are `dataLayer` pushes. Routing to GA4, Ads or Pixel is decided in GTM, which is NOT FOUND in the repo.

| Event | Fired from (trigger) | Destination |
|---|---|---|
| `page_view` | No code. GTM/GA4 default | GTM |
| `lead_submit` | `LeadForm.tsx:232` (after 2xx), `ContactForm.tsx:106` | dataLayer → GTM |
| `inquiry_started` | `TourDetailsSidebar.tsx:186`, `BookingMobileBar.tsx:74`, `TourPackageCards.tsx:197`, `OfferSelection.tsx:94`, `LeadForm.tsx:258` (after tour submit) | dataLayer → GTM |
| `trip_request_start` | `TripPlannerForm.tsx:74` | dataLayer → GTM |
| `whatsapp_click` | 20+ CTAs (see §6). Missing on TourCard/ActivityCard/etc. | dataLayer → GTM; to Ads NOT FOUND |
| `package_view` | `PackageViewTracker.tsx:23` (tour detail mount) | dataLayer → GTM |
| `booking_started` | `TourDetailsSidebar.tsx:89`, `BookingMobileBar.tsx:86` | dataLayer → GTM |
| `booking_completed` | `BookingCompletedEvent.tsx:21` (`/booking/success`, sessionStorage dedup) | dataLayer → GTM |
| `phone_click` | `Footer.tsx:399` only | dataLayer → GTM |
| `form_start`, `payment_success`, `phone_call_click` | NOT FOUND | — |
| Server: Google offline conversion | `enqueueForLead` (CONVERTED) / `enqueueForBooking` (online payment) | Data Manager API (direct) |
| Server: Meta CAPI `Purchase` | same triggers, fbclid only | Graph API (direct) |

## 5. Database findings

All queries were run on `vertex` (live) and are read-only. "Last 60 days" means `createdAt >= now() - 60 days`, B2C only (`b2bAgentId IS NULL`), unless stated.

**Offline conversions (Q19, Q21)**

| Table | Rows | SENT | PENDING | FAILED |
|---|---|---|---|---|
| `OfflineConversion` (all time, all platforms) | **0** | 0 | 0 | 0 |

There are no errors to report, because no row has ever been created. **Evidence that nothing has ever uploaded:** zero rows, and 0 of the 5 all-time bookings carry a gclid or fbclid.

**Lead status, last 60 days (Q25)** — 35 B2C leads (+1 B2B)

| Status | Count |
|---|---|
| CONNECTED | 18 |
| ON_HOLD | 8 |
| CONVERTED | 4 |
| REJECTED | 3 |
| NEW | 1 |
| NOT_CONNECTED | 1 |
| QUALIFIED / NEGOTIATION / IN_PROGRESS | 0 |

**Source × contact channel, last 60 days (Q26)**

| source | contactChannel | Count |
|---|---|---|
| META_ADS | (null) | 25 |
| GOOGLE_ADS | (null) | 4 |
| THIRD_PARTY | (null) | 2 |
| MANUAL | (null) | 2 |
| GOOGLE_ADS | FORM | 1 |
| GOOGLE_ADS | WHATSAPP | 1 |

By `sourcePage`: NULL (staff-created, no ref) 28 · `whatsapp` (ref resolved) 4 · `home` 2 · `trip-planner` 1.

**Identifiers, last 60 days (Q27)**

| Has Google click ID | Has fbclid | Has any UTM | No click ID | No attribution at all | Total |
|---|---|---|---|---|---|
| 5 | **0** | 7 | 30 | 28 | 35 |

All 25 `META_ADS` leads have no fbclid and no UTM, so the source was picked by hand.

**Funnel, last 60 days (Q28)**

| Reached QUALIFIED (status or activity log) | CONVERTED | Has booking | Booking has a recorded payment |
|---|---|---|---|
| 1 | 4 | 4 | 4 |

The 5 Google-click leads are all WhatsApp-ref or trip-planner leads using campaign `23981948639`: 2 CONNECTED, 2 REJECTED, 1 NEW, 0 booked.

**September bookings (Q29)**

| Booking | Created | Amount | Paid | Lead source | contactChannel | sourcePage | gclid | fbclid | UTM | Offline conv / CAPI rows |
|---|---|---|---|---|---|---|---|---|---|---|
| `cmttps3ko…` | 2026-09-09 | ₹46,000 | ₹2,000 | META_ADS | — | — | no | no | none | 0 |
| `cmttyi8f1…` | 2026-09-09 | ₹21,500 | ₹1,000 | META_ADS | — | — | no | no | none | 0 |
| `cmtye0kn1…` | 2026-09-12 | ₹23,500 | ₹23,500 | META_ADS | — | — | no | no | none | 0 |

No offline conversion and no CAPI event was sent for any of the three, and nothing could have been, because none has an identifier.

**WhatsApp attribution tokens (Q7, Q11)**

| Prefix (derived) | Minted | Consumed (resolved into a lead) |
|---|---|---|
| G (Google click) | 516 | 9 |
| M (fbclid) | 267 | 1 |
| W (other / UTM only / landing page) | 135 | 0 |
| **Total** (2026-08-14 → 2026-09-29) | **918** | **10** |

- Tokens are created per *attributed visitor on page load*, not per WhatsApp click, so this is not a click count.
- 6 of the 10 consumed tokens (all August) have no surviving lead with a matching click ID; those leads were probably deleted.
- Weekly token counts jump from 38 to 194 around 2026-09-21, which matches when the consent flag was disabled.

## 6. WhatsApp CTA inventory

How the ref works: "Has ref" means the href goes through `useWhatsAppLink()` or `appendWhatsAppAttributionTag()`. The ref is appended **client-side after hydration, and only if a token exists**. A token exists only for visitors with a UTM, click ID or landing-page cookie, or with Trip Planner / Offer intent.

- Server-rendered HTML and "view source" therefore **never** show a ref. The live HTML confirms this: none of the wa.me hrefs contain `Ref`.
- A direct visitor with a clean URL also sees none.
- So "no ref visible" on header/footer/cards is expected for such a visitor and is not a bug in those components.

| File | Component / location | Has ref? | Fires `whatsapp_click`? |
|---|---|---|---|
| `src/components/layout/Navbar.tsx:117-120, 482-491` | Header "Plan My Trip" (desktop) | Yes | Yes (`header`) |
| `src/components/layout/Navbar.tsx:606-615` | Mobile sticky/FAB "Plan My Trip" | Yes | Yes (`header_mobile`) |
| `src/components/layout/Footer.tsx:87-89, 111-119` | Closing CTA "Plan My Trip Free →" | Yes | Yes (`footer_cta`) |
| `src/components/layout/Footer.tsx:90, 185-194` | Footer WhatsApp icon | Yes | Yes (`footer_social`) |
| `src/components/ui/organisms/TourCard.tsx:66-73, 237-250` | Every tour card "WhatsApp" | Yes (No if a CMS `whatsappHref` is passed, e.g. `adventures/[slug]/page.tsx:129`) | **No** |
| `src/components/activities/ActivityCard.tsx:33-37, 100-108` | Activity card "WhatsApp" | Yes | **No** |
| `src/components/leads/LeadForm.tsx:157, 462-490` | "Or chat on WhatsApp" under the form (homepage, `/destinations`, `/tours` hero card, `/plan-your-kashmir-trip`, destination detail) | Yes | Yes (`lead_form`) |
| `src/components/leads/LeadForm.tsx:267, 287-296` | Post-submit "Chat on WhatsApp now" | Yes | Yes (`lead_form`) |
| `src/components/leads/HeroWhatsAppCta.tsx:27-35` (used at `plan-your-kashmir-trip/page.tsx:170`, `TourCategoryHero.tsx:110`) | Hero "Chat With Our Kashmir Team" | Yes (+ planner intent) | Yes |
| `src/components/leads/TripPlannerMobileBar.tsx:14, 37-40` | Trip planner mobile bar | Yes | Yes (`lead_form`) |
| `src/components/layout/ListingHero.tsx` — **deployed** `HEAD:…:93` | `/tours`, `/activities`, `/adventures` hero CTA | **Broken** (raw CMS string, hard-coded test ref) | No |
| `src/components/layout/ListingHero.tsx:49-55, 101-109` — uncommitted | same | Yes, only when `ctaHref` starts `whatsapp:` | Yes (`listing_hero`) |
| `src/components/tours/TourDetailsSidebar.tsx:96-97, 327` | Tour detail "Need help?" | Yes | Yes (`tour_sidebar`) |
| `src/components/tours/TourCustomizationBanner.tsx:20-21, 52` | Tour customise banner | Yes | Yes |
| `src/components/tours/TourPackageCards.tsx:69, 177-183` | Package option cards | Yes | Yes |
| `src/components/tours/TourDetailsRelatedTours.tsx:32-37, 90` | Related tours | Yes | **No** |
| `src/components/offers/OfferHero.tsx:205`, `OfferEnquiry.tsx:182`, `OfferMobileBar.tsx:29` | Occasion offer CTAs | Yes (+ offer intent) | Yes |
| `src/components/public/PromoBanner.tsx:58-61`, `BannerStrip.tsx:70, 111` | CMS banners (`whatsapp:` type) | Yes | Yes |
| `src/components/campaign/CampaignPageClient.tsx:47-53` | Campaign page float | Yes (No if `campaign.whatsappHref` set) | **No** (`CampaignWhatsAppFloat.tsx`) |
| `src/components/common/AnnouncementModal.tsx:104, 195` | Announcement modal | Yes | **No** |
| `src/components/contact/ContactWhatsAppFloat.tsx:23-29` (`contact/page.tsx:322`) | Contact page float bubble | Yes | Yes (`float`) |
| `src/components/contact/ContactForm.tsx:272` (href from `contact/page.tsx:54, 223`) | Contact form "WhatsApp" link | **No** | **No** |
| `src/components/destinations/DestinationsCTABand.tsx:53` | `/destinations` "Talk to an Expert" (WhatsApp icon) | **No — `href="#"`** | No |
| `src/components/about/AboutCTA.tsx:52` | About page CTA (CMS `ctaWhatsappHref`) | **No** | **No** |
| `src/components/booking/BookingForm.tsx:766` | Booking help link | **No** | **No** (`booking_help` source defined, unused) |
| `src/app/(public)/booking/success/page.tsx:106`, `booking/failed/page.tsx:93` | Post-payment support | **No** | No |
| `src/app/(public)/b2b-travel-partner-program/page.tsx:330-334, 946` | B2B page | **No** (B2B, low priority) | Yes via `B2bWhatsAppLink` (`b2b_page`); `:946` no |
| `src/app/api/leads/route.ts:356` | Duplicate-lead toast link | **No** (lead already exists) | No |
| `src/components/hero/HeroContent.tsx:120` | "Talk to Expert", **wrong number `919419000000`** | No | No. Dead code: only used by `HeroR3F`/`HeroParallax` → `HeroSpline`, which nothing imports |
| `src/components/home/AdventureSection.tsx:20-21, 128` | Adventure card | Yes | No. Dead code: no importer |

**Q9 checklist**

| Item | Result |
|---|---|
| Header, mobile sticky, every tour card, activity cards, `/plan-your-kashmir-trip` "Or chat", homepage "Or chat", footer, "Plan My Trip Free →", `/destinations` "Or chat" | **Include the ref in code**, when a token exists |
| `/destinations` "Talk to an Expert" | `href="#"` |
| `/tours` hero | Broken (B1) |

## 7. Content inconsistencies

**Q30 — Site stats**

| Claim | Where shown | Source | Value |
|---|---|---|---|
| Travellers | Home hero stats; `/tours`, trip planner, category heroes | `SiteStat` (section `hero`, label `Travellers`), via `src/app/(public)/page.tsx:74` and `src/lib/publicHeroStats.ts:28-33` | **1100 +** → "1,100+" |
| Travellers | Home "Bestsellers" subtitle | `HomeSection.packages.subtitle` (DB) | "loved by **12,000+** travellers" |
| Travellers | Home testimonials title | `HomeSection.testimonials.title` (DB) | "**12,000** travellers can't be wrong" |
| Travellers | Login/auth panels | hard-coded `src/components/auth/AuthLeftPanel.tsx:9`, `AuthImagePanel.tsx:101` | "12,000+" |
| Travellers | Seed defaults | `prisma/seed.ts:563, 1937, 1969, 2068` | 12000 |
| Curated trips | Homepage | `SiteStat` hero `Curated Trips` (admin-typed) | **20+** |
| Curated trips | `/tours`, trip planner, categories | live count, `publicHeroStats.ts:25, 37` (published `region=KASHMIR`) | **7** |
| Curated trips | Homepage derived stat | `src/app/(public)/page.tsx:163-169` | "N Kashmir Tours" (live) |
| Curated trips | Actual published tours | `Tour` table | **8** (7 Kashmir + 1 Ladakh) |
| "Planned this month" | Home form note | `HomeContent.formNote` | "20+ planned their trip this month" (3 form leads in 60 days) |
| Rating | Homepage | `SiteStat` hero `Rating` (admin-typed) | **4.9★** |
| Rating | `/tours`, trip planner, categories | live `avg(Review.rating)` where approved, `publicHeroStats.ts:24, 41-43` | **5.0★** (12 reviews, avg 5.00) |
| Rating | Auth panels | hard-coded `AuthLeftPanel.tsx:10` | "4.9/5" |

The homepage uses the admin-typed `SiteStat` rows, while the listing pages use `getPublicHeroStats()`, which replaces "Curated Trips" and "Rating" with live values. That is why the two sets of pages disagree.

**Q31 / Q32 — Tour duration / slug**

The card label is computed in `src/app/(public)/tours/page.tsx:133` and `plan-your-kashmir-trip/page.tsx:197` as `${duration-1}N / ${duration}D`, from `Tour.duration` (days).

| Slug | Title | `duration` | Card shows | Mismatch |
|---|---|---|---|---|
| `kashmir-family-tour-package-5n-6d` | "Kashmir Family Tour Package - 5 Nights 6 Days" | **5** | 4N / 5D | `duration` should be 6 (or the title/slug are wrong) |
| `kashmir-budget-tour-package-4n-5d` | "Kashmir Budget Tour Package \| 5 Nights 6 Days" | 6 | 5N / 6D | **slug** says 4N-5D |
| `luxury-kashmir-honeymoon-package-5n-6d` | "Luxury Kashmir Honeymoon Package" | 6 | 5N / 6D | consistent |
| others | — | — | — | consistent |

**Q33 — `/destinations` dead links**

| Link | File:line |
|---|---|
| "Talk to an Expert" | `src/components/destinations/DestinationsCTABand.tsx:53` (`href="#"`) |
| "View all experiences" | `src/components/destinations/DestinationsThingsToDo.tsx:86` (`href="#"`) |
| 8 "Popular things to do" tiles (Shikara Ride, …) | `src/components/destinations/DestinationsThingsToDo.tsx:19-28` (hard-coded array), rendered at `:67-70` with `href="#"` |

All are rendered from `src/app/(public)/destinations/page.tsx:110-111`. The tiles are a hard-coded list, not linked to the `Activity` table that `/activities/[slug]` uses.

**Q34 — Minimum-pax pricing**

- The data is a single `Tour.priceFrom` (per person) plus `Tour.minPersons`. Budget tour: ₹11,999, min 4. There is no tiered or per-pax price field in the schema.
- Rendering: `tourCardPricing()` (`src/lib/tours/cards.ts:13-27`) returns `{p: formatINR(priceFrom), minPersons}`. `TourCard` then renders "per person" plus " (min N pax)" when N > 1 (`src/components/ui/organisms/TourCard.tsx:208-221`).
- Package-option tours instead show `priceForTwo` with the suffix "/ 2 persons" (`cards.ts:20-22`, `packageOptionCard` `:53-75`).
- Enforcement: `create-order` rejects `travellers < minPersons` (`src/app/api/bookings/create-order/route.ts:176-179`), so a couple cannot book this package online at any price.
- To make the price respond to pax, the pieces needed are:
  - a price-by-pax source (a tier table or a package-option-style `priceFor{n}`);
  - a pax selector state in `TourCard` or `ToursPageClient`;
  - `tourCardPricing()` taking the pax count;
  - `create-order` pricing from the same tier, since price is server-computed per ADR-0004.

## 8. Recommended fix order

Ranked by impact vs effort. Not implemented.

1. **Fix the `/tours` hero CTA data** (tiny effort, high impact). Change `HomeSection.toursHero.ctaHref` to `whatsapp:Hi Vertex Kashmir Holidays! I'd like to plan my Kashmir trip…`, with no hard-coded ref, and ship the uncommitted `ListingHero` change. Check the other listing heroes for the same pattern.
2. **Make ref capture part of the WhatsApp lead workflow** (low effort, very high impact). Make the ref field prominent or required-if-present in New Lead, allow adding a ref on lead *edit*, and train sales. The refs already exist on 918 visitors, and only 10 have been used.
3. **Fix the Google Ads form conversion in GTM** (low effort, high impact). Point the Ads conversion at `lead_submit` only, then confirm counts against CRM form leads. This is outside the repo.
4. **Send a Google Ads conversion for WhatsApp** (low effort). Forward `whatsapp_click` to a secondary Ads conversion in GTM, and add `trackWhatsappClick` to TourCard, ActivityCard, RelatedTours, AnnouncementModal, ContactForm and AboutCTA (B6).
5. **Allow offline conversions without a click ID** (medium effort, high impact). Use Enhanced Conversions for Leads (hashed phone/email) for Google, and CAPI with hashed phone for Meta. Remove the click-ID-only gate in `platformsFor` and the Google adapter's `clickId` check. Confirm `META_CAPI_TEST_EVENT_CODE` is unset in production, and add `event_id`.
6. **Resolve the consent flag properly** (medium effort). Decide whether the TEMP flag stays. If consent returns, implement Consent Mode v2 (load GTM with `default denied` instead of not loading it), so Ads keeps modelling and the landing-page gclid is still seen.
7. **Add a QUALIFIED-stage conversion** (low–medium effort). It fires earlier and more often than CONVERTED (4 in 60 days), which gives Ads more signal to learn from. Consider sending gross profit instead of gross booking amount.
8. **Schedule the offline-conversion retry** (low effort). Use an external cron hitting `/api/cron/offline-conversions`, or a daily Vercel slot.
9. **Content fixes** (tiny effort). Family tour `duration` 5→6, Budget slug (with a redirect), unify the 1,100 / 12,000 / 20+ / 4.9 claims into the single `publicHeroStats` source, and wire up the `/destinations` `#` links.
10. **Pax-responsive pricing** (medium–high effort; needs schema, UI and a server pricing change). Reconsider `minPersons` on the Budget package in the meantime.
11. **Housekeeping** (tiny effort). Delete dead `HeroContent`/`HeroR3F`/`HeroParallax`/`HeroSpline` and `AdventureSection`, which contain a wrong hard-coded WhatsApp number. Populate `Lead.createdById` on admin-created leads.
