# Public pages inventory — paid-campaign readiness

Snapshot: **30 Sep 2026, ~18:20 IST (12:50 UTC)**. Read-only audit — no code, DB rows or settings were changed.
Scope: customer-reachable pages only (no `/admin`, CRM, `/api`, `/account`, `/login`).

---

## 0. How this was built (and what to trust)

| Source | Used for |
|---|---|
| Live crawl of `https://vertexkashmirholidays.com` (HTTP GET, 79 URLs incl. probes) | Live/404 status, rendered `<title>`, meta description, H1, canonical, robots, JSON-LD types, body word count, CTAs, visible prices, link graph |
| SELECT-only queries on the `vertex` database (the DB `.env.local` points at; the project notes call it LIVE) | Tour / collection / offer / campaign / destination / activity / blog rows, published flags, prices, min pax, editorial word counts |
| Source code (`src/app/(public)`, `src/components`, `src/lib`) | Where prices/CTAs/schema come from; sitemap logic; nav/footer link sets |
| `git` (`origin/main` @ 575c99e, 24 Sep, vs branch `VERTEX-doc-links`) | Which routes exist in which branch |

Caveats that matter when reading the numbers:

1. **Word counts.** "Rendered words" = all visible text in `<body>` minus `<header>`, `<nav>`, `<footer>`, scripts. It **includes card, form, FAQ-accordion and filter text**, so it overstates editorial copy. Where an editorial field exists in the DB I also give "editorial words" (HTML stripped, JSON fields summed).
2. **Titles and descriptions are truncated by the site itself.** `src/lib/seo.ts` cuts the title to `60 − suffix` characters (~36) and the description to 160, appending "…" (`MAX_TITLE_LENGTH = 60`, `truncateForSeo`). The strings below are **as rendered**, so many end mid-phrase. The un-truncated source title is only visible in the OG title tag.
3. **Content is being edited live.** Between my first and last reads, collections `leh-ladakh-tour-packages` and `kashmir-offbeat-packages` were set to unpublished (DB `updatedAt` 12:43 UTC) and `kashmir-tour-packages` was saved at 12:44 UTC. Vercel ISR caches (5 min on collections) lag DB changes, so a URL can serve 200 for a few minutes after being unpublished. Statuses below are the last state I saw.
4. **200 ≠ live.** Several routes have a `loading.tsx`, so unpublished tours and fake authors return HTTP 200 with a "Not Found" title and `noindex`. I classify by title/robots, not status code.
5. "Main keyword it reads as" is my inference from H1 + title + description. I did not pull Search Console or Ads data.

---

## 1. Headline findings

1. **8 tours are published** (7 Kashmir + 1 Ladakh). 5 of the 8 show a "% OFF" badge that differs from the struck-through price, 4 of them by 7+ points (e.g. Vaishno Devi shows **25% OFF** on ₹26,000 → ₹24,999, which is 4%). See §A.
2. **Titles/descriptions are cut mid-phrase site-wide** (`truncateForSeo`). The homepage title renders as `Kashmir Tour Packages & Kashmir…`.
3. **The three seasonal offer pages are live** (`/offers/diwali…`, `/offers/christmas…`, `/offers/new-year…`) with prices (₹21,000–₹65,000 for 2 adults). Only **Diwali is fully written**. Christmas and New Year have no overview, no "why", no inclusions/exclusions and no FAQ (all empty in DB) — and neither has a custom meta description.
4. **No offer, campaign or tour is "unpublished but ready to go".** Every OccasionOffer (3) and Campaign (3) row is `published = true`. What is unpublished: 5 tours (LOC Border, Manali, and 3 hidden internal CRM "offer-*" tours), collections `leh-ladakh`/`kashmir-offbeat` (as of 12:43 UTC) and `himachal` is published but empty, so it 404s. See §2.
5. **Production serves code that is not on `origin/main`.** `/offers*` and the collection pages (`/kashmir-tour-packages`) return 200 in production; their code exists only on `origin/VERTEX-doc-links` / local `VERTEX-doc-links` (3 commits ahead of `origin/main`). So production was deployed from that branch or an equivalent build. I did not verify which.
6. **The three Adventure campaign pages show expired batches as bookable.** Gurez: 3 of 4 dates already past (15 Jul, 10 Aug, 12 Sep) still labelled "AVAILABLE — Book". Hidden Kashmir: 2 of 3 past. Trekking: **all 5 past**. Their meta text says "Jun–Sep" / "Jun–Oct".
7. **Nothing winter-specific is sellable except the Christmas and New Year offers.** No winter/snow collection, no Gulmarg package, no ski package, no short (3N/4N) tour. See §E.
8. **No tour has an FAQ** (0 published FAQs on all 8), so tour pages emit no FAQPage schema. `/plan-your-kashmir-trip` (the Ads landing page) emits only the sitewide `TravelAgency` schema.
9. **Online booking exists only on tour pages** ("Book Now — Pay 10 % Advance" → `/booking?tour=…` → Razorpay). Offer pages, collections, categories, city pages, adventures, activities and destinations all resolve to WhatsApp or a lead form (`POST /api/leads`).
10. Sitemap (`/sitemap.xml`, as served today) omits `/offers*`, the collection pages, `/activities` and `/plan-your-kashmir-trip`. In code, `sitemap.ts` includes offers and collections (so today's live sitemap is a stale 24 h cache), but **does not list `/activities` or `/plan-your-kashmir-trip` at all**.

---

## 2. Live vs local-only vs unpublished

### 2.1 Route families and where the code lives

| Route family | In `origin/main` (24 Sep)? | On branch `VERTEX-doc-links`? | Served by production today? |
|---|---|---|---|
| `/`, `/tours`, `/tours/[slug]`, `/tours/category*`, `/destinations*`, `/activities*`, `/adventures*`, `/blog*`, `/about`, `/contact`, `/faq`, `/reviews`, `/careers*`, legal pages | Yes | Yes | Yes |
| `/plan-your-kashmir-trip`, `/b2b-travel-partner-program`, `/tours/kashmir-tour-packages-from/[city]`, `/booking` (checkout) | Yes | Yes | Yes |
| **`/offers`, `/offers/[slug]`** | **No** | Yes (commit 34b3632, also on `origin/VERTEX-doc-links`) | **Yes (200)** |
| **Tour-collection pages at `/[slug]`** (`/kashmir-tour-packages`…) | **No** (`collectionQueries.ts` absent) | Yes | **Yes** (Kashmir 200; others see below) |

### 2.2 Content that exists but is not publicly reachable

| Item | Where | State | Public result |
|---|---|---|---|
| Kashmir LOC Border Adventure Tour (`kashmir-loc-border-adventure-tour-4n-5d`, ₹15,499, 4N/5D) | `Tour` | `published=false` | "Tour Not Found", noindex |
| Manali Tour Package 3D/2N (`manali-tour-package-3-days-2-nights`, ₹8,000, 4 package options, inquiry-only form) | `Tour` (region HIMACHAL) | `published=false` | "Tour Not Found", noindex |
| 3 hidden CRM tours `offer-diwali-…`, `offer-christmas-…`, `offer-new-year-…` (₹21,000, 4 package options) | `Tour` | `published=false` (internal CRM mirror of each offer) | Not routable |
| Collection `leh-ladakh-tour-packages` | `TourCollection` | `published=false` as of 12:43 UTC (was published earlier this session) | Was 200 (cached), will 404 on revalidate |
| Collection `kashmir-offbeat-packages` | `TourCollection` | `published=false` as of 12:43 UTC | 404 |
| Collection `himachal-tour-packages` | `TourCollection` | `published=true` but its only tour (Manali) is unpublished | 404 (empty collections 404 by design) |
| Tour category `luxury-tour-packages` | code (`TOUR_CATEGORY_META`) | No published LUXURY-category tour | 200 shell, `noindex`, not in sitemap |
| Legacy `Offer` table rows (Monsoon Escape / Honeymoon Early-Bird / Squad of 6+) | DB only | `isActive=true` but **not rendered anywhere public** (only read by admin/home) | Not visible |

**Unpublished offer / seasonal / campaign pages: none.** All 3 `OccasionOffer` and all 3 `Campaign` rows are published. If you remember building others, they are not in this database.

---

## 3. Sitewide elements (apply to every page unless noted)

**Global chrome** (all `(public)` pages *except* `/adventures/[slug]`, which renders standalone with no navbar/footer):

| Element | Label | Destination | Opens |
|---|---|---|---|
| Header button | "Plan My Trip" | `wa.me/917889577789?text=Hi Vertex Kashmir Holidays! I'd like to plan my Kashmir trip…` | WhatsApp |
| Header nav | Tours ▾ (collection submenu), Trip Planner, Destinations, Offers ▾ (badge "New"), Travel Stories, Reviews, login icon | `/tours`, `/plan-your-kashmir-trip`, `/destinations`, `/offers`, `/blog`, `/reviews`, `/login` | Pages |
| Mobile bottom bar | Home, Tours, Destinations | `/`, `/tours`, `/destinations` | Pages |
| Footer | 3 category links (Honeymoon, Family, Group), All categories, Destinations, Activities, Reviews, B2B, About, Contact, Refund, Terms, Privacy, FAQ, Blog, Adventures, Careers, 5 city pages, `tel:`, `mailto:`, WhatsApp | various | Pages / WhatsApp / phone / email |

Number: +91 78895 77789 (`SiteSettings.sitePhone` / `whatsapp`). Every WhatsApp link carries a prefilled message; some (e.g. `/tours` "Get Your Free Kashmir Tour Quote") also append an attribution tag `[Ref: …]`.
**Sitewide schema:** `TravelAgency` (from `(public)/layout.tsx`) on every page.
**Lead form endpoint:** `POST /api/leads` (`LeadForm.tsx`). "Get a Flight/Train Quote" opens a modal `LeadForm` (`TransportAssistanceBanner`).
**Advance payment:** 10 % (`ADVANCE_PCT = 10`), Razorpay.

Below, "shared chrome CTAs" means the header/footer set above and is not repeated per row.

---

## 4. Page inventory

Legend — **Commercial?**: *Yes-book* = can pay online; *Yes-enquiry* = priced, converts via WhatsApp/lead form; *Info* = informational.
Title/description are **as rendered (truncated)**.

### 4.1 Home and Trip Planner

| | `/` | `/plan-your-kashmir-trip` |
|---|---|---|
| File | `src/app/(public)/page.tsx` | `src/app/(public)/plan-your-kashmir-trip/page.tsx` |
| Status | Live | Live (in `origin/main`) |
| Type | Home | Utility / landing (Ads landing per `scripts/seed-seo-keyword-alignment.ts`) |
| Sells / commercial? | Whole catalogue; top 4 Kashmir tours. **Yes-enquiry / links to Yes-book** | Compare packages + custom quote. **Yes-enquiry** |
| H1 | "Vertex Kashmir Holidays Kashmir Tour Packages for Autumn & Winter." | "Kashmir Tour Packages — Plan Your Trip Your Way" |
| Title | `Kashmir Tour Packages & Kashmir…` | `Kashmir Tour Packages & Kashmir…` (**identical to home**) |
| Meta desc | "Book Kashmir tour packages, Kashmir honeymoon packages and family tour packages with Vertex Kashmir Holidays — transparent pricing, Dal Lake houseboats,…" | "Browse Kashmir tour packages, Kashmir honeymoon packages and Kashmir family tour packages with transparent pricing, or get a custom Kashmir trip package quote…" |
| Reads as | "kashmir tour packages" / holiday packages | "kashmir tour packages" / custom trip |
| Rendered words | 1,786 | 1,450 |
| Price shown | Yes — 4 tour cards, `Tour.priceFrom` / `priceWas` (per person) | Yes — tour cards `Tour.priceFrom`/`priceWas`; text "real, current pricing per person" |
| Schema | TravelAgency, WebSite, ItemList, FAQPage | TravelAgency **only** |

CTAs — Home: hero form **"Request Free Itinerary →"** (lead form → `/api/leads`); **"Explore Packages"** → `/tours`; **"Or chat on WhatsApp"** (WhatsApp); **"Get a Flight/Train Quote"** (modal lead form); per-card **"Book Now"** → `/tours/{slug}` and **"WhatsApp"** (prefilled with tour name); **"View All Packages →"** → `/tours`; activities carousel "See all" → `/activities`; **"View all FAQs"** → `/faq`; video-review ▶ buttons.
CTAs — Trip Planner: **"Not sure? Help me plan the whole trip"** + tabs *Flight / Train / Bus · Kashmir Tour · Hotel / Stay* (lead form, **"Get My Trip Quote"**); WhatsApp ×7 (hero "chat", "Still deciding? Chat with us on WhatsApp", per-card); per-card "Book Now" → tour; mobile bar (`TripPlannerMobileBar`).

### 4.2 Listings and hubs

| Route | Type / commercial? | H1 | Title | Meta description | Reads as | Words | Price (source) | Schema |
|---|---|---|---|---|---|---|---|---|
| `/tours` | Listing / Yes-enquiry (links to Yes-book) | Kashmir Tour Packages — Prices, Itineraries & Free Quote | `Kashmir Tour Packages — Family,…` | Compare Kashmir tour packages and Srinagar tour package options … honeymoon packages, family tour packages and Kashmir trip… | kashmir tour packages / srinagar tour package | 603 | Cards: `Tour.priceFrom`/`priceWas` | TravelAgency, BreadcrumbList, ItemList |
| `/tours/category` | Hub / Yes-enquiry | Kashmir Tour Categories | `Kashmir Tour Categories —…` | Browse every Kashmir tour category — honeymoon, family, group, adventure, luxury, budget, pilgrimage and premium … | kashmir tour categories | 965 | Category cards (from tours) | + CollectionPage, FAQPage |
| `/destinations` | Listing / Info | Explore the breathtaking destinations of Kashmir | `Kashmir Destinations — Gulmarg,…` | Explore the most beautiful destinations in Kashmir & Ladakh … meadows, lakes, glaciers and high passes, with curated tour… | kashmir destinations | 429 | No | TravelAgency, BreadcrumbList |
| `/activities` | Listing / Yes-enquiry (activities + cross-sell) | Things to Do in Kashmir | `Things to Do in Kashmir —…` | Discover the best things to do in Kashmir — shikara rides, Gulmarg gondola, trekking, skiing, river rafting and more… | things to do in kashmir | 341 | "From ₹…" per card (`Activity.price`); a price-range slider | TravelAgency, BreadcrumbList, ItemList |
| `/adventures` | Listing / Yes-enquiry | Kashmir Campaigns & Seasonal Experiences | `Kashmir Campaigns & Seasonal…` | Explore curated Kashmir campaigns … limited-time seasonal experiences, group departures and themed itineraries… | kashmir campaigns / seasonal experiences (vague) | 280 | Yes — `Campaign.tiers` strings | TravelAgency, BreadcrumbList, ItemList |
| `/blog` | Listing / Info | Kashmir Stories & Travel Guide | `Kashmir Travel Blog — Guides,…` | Expert Kashmir travel guides … best time to visit, Gulmarg & Pahalgam tips, houseboat stays, budgets and sample itineraries. | kashmir travel blog | 157 (cards render client-side) | No | TravelAgency, BreadcrumbList |
| `/offers` | Hub / Yes-enquiry | Kashmir Holiday Offers | `Kashmir Holiday Offers` | Fixed-date Kashmir trips for the festive and holiday season — choose your dates, pick a package and see the price for 2 adults upfront. | kashmir holiday offers | **107** | "from ₹21,000" per offer (`OccasionOfferPackage.priceForTwo`, min) | TravelAgency, BreadcrumbList, ItemList |

CTAs:
- `/tours`: **"Get Tour Quotes"** (form), **"Get Your Free Kashmir Tour Quote"** (WhatsApp, `[Ref:]` tag), **"Get a Flight/Train Quote →"** (modal), filter chips *All Tours (8) · Kashmir (7) · Ladakh (1)*, category links, per-card "Book Now"/"WhatsApp", **"Subscribe Now"** (newsletter).
- `/tours/category`: **"Get a Free Quote"** (form), FAQ accordion buttons, 8 category cards.
- `/destinations`: **"Request Free Itinerary"** (form), region filter (*All · Kashmir Valley*), destination cards → `/destinations/{slug}`.
- `/activities`: **"Plan My Activities"** (form), **"Get a Flight/Train Quote"**, per-card **"WhatsApp"** + **"View Details"**, tour cross-sell.
- `/adventures`: **"Get Campaign Offers"** (form), 3 campaign cards → `/adventures/{slug}`.
- `/blog`: **"Request Free Itinerary"**, **"Get a Flight/Train Quote"**.
- `/offers`: only the three offer cards → `/offers/{slug}` and WhatsApp; **no form**.

### 4.3 Tour collections (top-level `/[slug]`)

File: `src/app/(public)/[slug]/page.tsx` → `TourCollectionView`. Type: destination/theme landing. Commercial: **Yes-enquiry** (lists priced tours). CTAs on every collection: **"Get a Free Quote"** (form), **"Chat With Our Kashmir Team"** (WhatsApp), per-card **"WhatsApp"**/"Book Now". No FAQ rows (0) on any collection, so no FAQPage.

| Route | Status (12:50 UTC) | H1 | Title | Meta description | Reads as | Rendered / editorial words | Price | Schema |
|---|---|---|---|---|---|---|---|---|
| `/kashmir-tour-packages` | **Live** (7 tours) | Kashmir Tour Packages | `Kashmir Tour Packages —…` | Compare Kashmir tour packages from Vertex — houseboats, Gulmarg, Pahalgam and Sonamarg with private cabs and hand-picked hotels. Get a free quote. | kashmir tour packages | 606 / **72** | ₹11,999–₹25,999 from (`Tour.priceFrom`) + struck prices | TravelAgency, BreadcrumbList, CollectionPage, ItemList |
| `/leh-ladakh-tour-packages` | DB unpublished (12:43 UTC); cache still 200 → will 404 | Leh-Ladakh Tour Packages | `Leh-Ladakh Tour Packages —…` | Leh-Ladakh tour packages from Vertex — Nubra Valley, Pangong Lake, Tso Moriri and Hanle … | leh ladakh tour packages | 343 / **70** | ₹24,499 (1 tour) | same |
| `/kashmir-offbeat-packages` | Unpublished → 404 (was live earlier: 325 words) | Kashmir Offbeat Packages | `Kashmir Offbeat Packages — Gurez…` | Offbeat Kashmir tour packages from Vertex — Gurez Valley and lesser-visited regions … | kashmir offbeat packages | 325 / **51** | ₹16,499 (1 tour) | same |
| `/himachal-tour-packages` | Published but empty → **404** | — | — | — | — | — / 184 | — | — |

### 4.4 Tour-category pages (trip type)

File: `src/app/(public)/tours/category/[category]/page.tsx`. Type: category/listing. Commercial: **Yes-enquiry + Yes-book** (embedded booking sidebar for a featured tour: tabs *Inquiry / Book*, "Send Inquiry", "Book Now — Pay 10 % Advance").
CTAs (all 7): **"Get a Free Quote"**, WhatsApp ×11 (hero, "Chat With Our Kashmir Team", "Need Help? Chat with our travel expert +91 7889577789", per-card), per-card "Book Now"/"View Full Itinerary" → `/tours/{slug}`.
Schema (all): TravelAgency + BreadcrumbList only (no ItemList/FAQ).

| Route | H1 | Title | Meta description | Reads as | Words |
|---|---|---|---|---|---|
| `/tours/category/honeymoon-packages` | Honeymoon Packages | `Kashmir Honeymoon Packages —…` | Romantic Kashmir honeymoon packages featuring luxury hotels, houseboats, private sightseeing, and unforgettable experiences for couples. | kashmir honeymoon packages | 584 |
| `/tours/category/family-tour-packages` | Family Tour Packages | `Kashmir Family Tour Packages —…` | Book a Kashmir family tour package with comfortable hotels, private cabs, sightseeing, and flexible itineraries … | kashmir family tour packages | 582 |
| `/tours/category/adventure-tour-packages` | Adventure Tour Packages | `Kashmir Adventure Tour Packages…` | Thrilling Kashmir adventure tour packages featuring trekking, skiing, river rafting, and guided mountain expeditions … | kashmir adventure packages | 610 |
| `/tours/category/budget-tour-packages` | Budget Tour Packages | `Kashmir Budget Tour Packages —…` | Affordable Kashmir budget tour packages covering the valley's highlights … | kashmir budget packages | 602 |
| `/tours/category/group-tour-packages` | Group Tour Packages | `Kashmir Group Tour Packages —…` | Affordable Kashmir group tour packages with fixed departures, guided sightseeing … | kashmir group packages | 580 |
| `/tours/category/pilgrimage-tour-packages` | Pilgrimage Tour Packages | `Kashmir Pilgrimage Tour Packages…` | Guided Kashmir pilgrimage tour packages to sacred shrines and holy sites … | kashmir pilgrimage packages | 613 |
| `/tours/category/premium-tour-packages` | Premium Tour Packages | `Kashmir Premium Tour Packages —…` | Elevated Kashmir premium tour packages with upgraded hotels … | kashmir premium packages | 579 |
| `/tours/category/luxury-tour-packages` | — (empty shell) | `Kashmir Luxury Tour Packages —…` | — | — | 0 — **noindex**, no LUXURY tour exists |

### 4.5 Origin-city pages

File: `src/app/(public)/tours/kashmir-tour-packages-from/[city]/page.tsx`. Config: `src/lib/originCities.ts` (5 cities). Type: SEO landing. Commercial: **Yes-enquiry**. Live (in `origin/main`).
CTAs (all 5): tabs *Flight / Train / Bus · Kashmir Tour · Hotel / Stay*, **"Not sure? Help me plan the whole trip"**, **"Get My Trip Quote"** (lead form), **"Get a Flight/Train Quote"** (modal), WhatsApp ×8, per-card "Book Now" → tour.
Price: tour cards (`Tour.priceFrom`). Schema: TravelAgency, BreadcrumbList, CollectionPage, ItemList, FAQPage (all 5).

| Route | H1 | Title | Meta description | Words |
|---|---|---|---|---|
| `/tours/kashmir-tour-packages-from/mumbai` | Kashmir Tour Packages from Mumbai | `Kashmir Tour Packages from Mumbai` | Kashmir tour packages from Mumbai with flight or train options arranged for you. Compare Kashmir honeymoon packages, family tour packages and group packages,… | 779 |
| `…/delhi` | … from Delhi | `Kashmir Tour Packages from Delhi` | (same template, "Delhi") | 815 |
| `…/bangalore` | … from Bengaluru (Bangalore) | `Kashmir Tour Packages from…` | (template, "Bengaluru (Bangalore)") | 787 |
| `…/hyderabad` | … from Hyderabad | `Kashmir Tour Packages from…` | (template) | 767 |
| `…/kolkata` | … from Kolkata | `Kashmir Tour Packages from Kolkata` | (template) | 778 |

The five descriptions are the same sentence with the city swapped (config `metaDescription`).

### 4.6 Tour detail pages (published, 8)

File: `src/app/(public)/tours/[slug]/page.tsx`. Type: tour detail. Commercial: **Yes-book + Yes-enquiry** (`formMode = BOTH` on all 8).
**CTAs on every tour page:** sidebar tabs **Inquiry / Book**; **"Send Inquiry"** (lead form); **"Book Now — Pay 10 % Advance"** (→ `/booking?tour={slug}` → Razorpay; needs date + travellers, min pax enforced); **"Customize This Trip"** (WhatsApp, prefilled with tour name, asks for updated price); **"WhatsApp Us"**; **"Need Help? Chat with our travel expert +91 7889577789"** (WhatsApp); **"Get a Flight/Train Quote"** (modal); mobile sticky `BookingMobileBar`; related-tour cards labelled **"Enquire Now"** → `/booking?tour=…`; **"Share"**; gallery buttons.
**Price:** `Tour.priceFrom` "per person (min N pax)" + `Tour.priceWas` struck through + `Tour.discountPct` badge. **Schema:** TravelAgency, BreadcrumbList, **Product** (with Offer + AggregateRating), **TouristTrip**; no FAQPage (0 tour FAQs).

| Route | H1 (as rendered) | Title | Meta description | Reads as | Words |
|---|---|---|---|---|---|
| `/tours/luxury-kashmir-honeymoon-package-5n-6d` | Luxury Kashmir Honeymoon Package 5N / 6D | `Luxury Kashmir Honeymoon Package…` | Book a luxury 5 Nights 6 Days Kashmir Honeymoon. Includes Boutique / Romantic Hotel stays, a Premium Houseboat, private transport, and local Union cabs. | luxury kashmir honeymoon package | 2,780 |
| `/tours/premium-kashmir-tour-package-6n-7d` | Premium Kashmir Tour Package \| 6 Nights 7 Days 6N / 7D | `6 Nights 7 Days Premium Kashmir…` | Book our Premium Kashmir Tour Package **(5N/6D)** … *(says 5N/6D; title says 6N/7D)* | premium kashmir tour package | 2,760 |
| `/tours/kashmir-family-tour-package-5n-6d` | Kashmir Family Tour Package - 5 Nights 6 Days **4N / 5D** *(H1 contradicts itself)* | `Kashmir Family Tour Package - 5…` | Explore Srinagar, Sonamarg, Pahalgam, and Gulmarg on a well-paced 5 Nights 6 Days Kashmir family tour. Private transport and Pahalgam Union cab included. | kashmir family tour package | 2,899 |
| `/tours/kashmir-group-tour-package-5n-6d` | Kashmir Group Tour Package \| 5 Nights 6 Days 5N / 6D | `5 Nights 6 Days Kashmir Group…` | Book our Kashmir Group Tour Package (5N/6D). Includes Deluxe Hotel stays, private group transport, a Comfortable Houseboat, and local Union cabs. | kashmir group tour package | 2,825 |
| `/tours/kashmir-budget-tour-package-4n-5d` | Kashmir Budget Tour Package \| 5 Nights 6 Days 5N / 6D *(slug says 4n-5d)* | `5 Nights 6 Days Kashmir Budget…` | Book our Kashmir Budget Tour Package (5N/6D). Includes Standard Hotel stays … | kashmir budget tour package | 2,819 |
| `/tours/vaishno-devi-kashmir-tour-package-6n-7d` | Vaishno Devi Kashmir Tour Package \| 6 Nights 7 Days 6N / 7D | `6 Nights 7 Days Vaishno Devi…` | Book our Vaishno Devi Kashmir Tour Package (6N/7D). Includes deluxe hotel stays, private family transport, a Premium Houseboat, and local Union cabs. | vaishno devi kashmir tour package | 3,131 |
| `/tours/gurez-valley-tour-package-4n-5d` | Gurez Valley Tour Package \| 4 Nights 5 Days 4N / 5D | `4 Nights 5 Days Gurez Valley…` | Explore remote Kashmir on our 4 Nights 5 Days Gurez Valley Tour Package. Includes comfortable stays, private transport, and guided trips to Dawar & Tulail. | gurez valley tour package | 2,556 |
| `/tours/leh-ladakh-adventure-tour-package-6n-7d` | Leh Ladakh Adventure Tour Package \| 6 Nights 7 Days 6N / 7D | `6 Nights 7 Days Leh Ladakh Tour…` | Explore Leh, Khardung La, Nubra Valley, Pangong Lake & Sham Valley on our private 6 Nights 7 Days Leh Ladakh Tour Package. Includes premium hotels & permits. | leh ladakh tour package | 3,487 |

Every H1 is `title + "NN / MD"` — the duration appears twice. The `4N / 5D` / `5N / 6D` suffix comes from `Tour.duration` and disagrees with the title for Family (duration 5 vs title 5N/6D).

### 4.7 Occasion-offer pages (3)

File: `src/app/(public)/offers/[slug]/page.tsx` → `components/offers/OfferView.tsx`. Type: offer/landing. Commercial: **Yes-enquiry** (fixed dates, per-tier prices; **no online payment**). Live (200) though not on `origin/main`.
**CTAs:** hero **"Get My {Diwali|Christmas|New Year} Package"** (opens lead form — label defaults from `occasionType`, `ctaLabel` is null on all three); tier buttons **"Choose Comfort / 3-Star / 4-Star / 5-Star"**; **"Ask on WhatsApp"** (prefilled with offer + selected tier); mobile sticky bar (WhatsApp); **"Add to my trip"** on add-on activity cards (Christmas/New Year); **"Get Travel Options"** → `/plan-your-kashmir-trip#trip-planner-form`; **"Plan a Custom Trip"** → `/plan-your-kashmir-trip`; related tour links → `/tours/{slug}` and `/kashmir-tour-packages`.
**Price:** `OccasionOfferPackage.priceForTwo` — Comfort ₹21,000 · 3-Star ₹32,000 · 4-Star ₹45,000 · 5-Star ₹65,000 (for 2 adults), all three offers; no strike-through prices.
**Schema:** TravelAgency, BreadcrumbList, WebPage, TouristTrip (Offer with 2-adult UnitPriceSpecification); **FAQPage on Diwali only**.

| Route | Dates | H1 | Title | Meta description (auto-generated; `metaDesc` null) | Rendered / editorial | What's missing in DB |
|---|---|---|---|---|---|---|
| `/offers/diwali-kashmir-tour-package-2026` | 6–11 Nov 2026 | Diwali Kashmir Tour Package 2026 | `Diwali Kashmir Tour Package 2026` | Diwali Kashmir Tour Package 2026 · 6 – 11 Nov 2026 · packages from ₹21,000 for 2 adults | 2,826 / itinerary 310, why 152, FAQ 429 (10 Q), 8 inclusions, 6 exclusions | overview text (0), named hotels (0) |
| `/offers/christmas-kashmir-tour-package-2026` | 22–27 Dec 2026 | Christmas Kashmir Tour Package 2026 | `Christmas Kashmir Tour Package…` | Christmas Kashmir Tour Package 2026 · 22 – 27 Dec 2026 · packages from ₹21,000 for 2 adults | 1,786 / itinerary 6 words total, add-on activities 47 | overview, why-this-offer, inclusions, exclusions, FAQs, named hotels: **all empty** |
| `/offers/new-year-kashmir-tour-2027` | 28 Dec 2026 – 2 Jan 2027 | New Year Kashmir Tour 2027 | `New Year Kashmir Tour 2027` | New Year Kashmir Tour 2027 · 28 Dec 2026 – 2 Jan 2027 · packages from ₹21,000 for 2 adults | 1,804 / same as Christmas | same as Christmas |

Sections rendered: Diwali — Choose Your Package, Day-by-Day Itinerary, Your Stays Night by Night, Why Kashmir This Diwali, **Inclusions & Exclusions**, Travellers Who Went With Us (reviews), **Diwali Trip FAQs**. Christmas/New Year — same minus *Why*, *Inclusions & Exclusions*, *FAQs*, plus **Add-On Activities** (Optional Skiing, Sledge ride, Pony ride — "not part of the package price"). Hotel rows read "Comfort Hotel or similar" — no property names on any tier.
Main keyword read: the occasion + "Kashmir tour package" (Diwali/Christmas/New Year).

### 4.8 Adventure / campaign pages (3)

File: `src/app/(public)/adventures/[slug]/page.tsx` (standalone microsite: **no site navbar/footer**). Type: offer/landing. Commercial: **Yes-enquiry** (priced tiers + dated batches). All `published=true`.
**CTAs (all 3):** **"Reserve My Seat →"** (form → lead), "Join the Expedition / Choose Your Trek / Join This Expedition →" → `#pricing`, per-batch **"Book"** → `#reserve`, "Talk to us" → `#reserve`, **"Call +91 7889577789"** → `tel:`, one WhatsApp icon link.
**Price:** `Campaign.tiers` strings (free text): Trekking ₹14,999 / ₹22,999 / ₹32,999; Gurez ₹16,999 group / ₹22,999 private; Hidden Kashmir ₹18,999 shared / ₹26,999 private; plus strike-through "old" prices. **Schema:** TravelAgency, BreadcrumbList, Product, Event; no FAQ (0 FAQs).

| Route | H1 | Title | Meta description | Words | Batches shown today |
|---|---|---|---|---|---|
| `/adventures/kashmir-trekking-camping` | Trek into alpine Kashmir | `Kashmir Trekking & Camping —…` | Kashmir Great Lakes (7 days), Tarsar Marsar (5 days) and Aru-Lidderwat (3 days) treks … Jun–Sep departures. | 1,799 | 10 Jul, 1 Aug, 22 Aug, 5 Sep, 20 Sep — **all past** |
| `/adventures/gurez-valley-expedition` | Beyond the Razdan Pass | `Gurez Valley Expedition —…` | 4-day Gurez Valley expedition from Srinagar … Limited to 10 guests. Jun–Oct. | 1,649 | 15 Jul, 10 Aug, 12 Sep past; **5 Oct** only future |
| `/adventures/hidden-kashmir-offbeat-border` | Where Kashmir ends, India begins | `Hidden Kashmir Offbeat Tour —…` | 5 Days exploring the LOC border villages … Inner Line Permits arranged. Limited batches. | 1,717 | 3 Aug, 7 Sep past; **5 Oct** only future |

### 4.9 Destination pages (8)

File: `src/app/(public)/destinations/[slug]/page.tsx`. Type: destination. Commercial: **Info** with tour cross-sell (published tours linked per destination). **Live (no publish flag — every row is public).**
**CTAs (all 8):** **"Request Free Itinerary"** (form), section tabs (*Overview · Things to Do · Tours · Gallery*), per-tour **"Book Now"** → `/tours/{slug}`, "View full tours" → `/tours`, WhatsApp ×2–9, FAQ accordions (Gulmarg/Pahalgam/Srinagar show the same sitewide FAQ set). **Price:** none on destination copy; tour cards show `Tour.priceFrom`. **Schema:** TravelAgency, BreadcrumbList, TouristDestination; + FAQPage on Srinagar, Gulmarg, Pahalgam only.

| Route | H1 | Title | Meta description | Reads as | Rendered / editorial words | Tours linked |
|---|---|---|---|---|---|---|
| `/destinations/srinagar` | Srinagar | `Srinagar Travel Guide: Places to…` | Discover Srinagar, the main gateway to Kashmir. Plan your trip with local tips on houseboats, the best time to visit, and top places to visit in Srinagar. | srinagar travel guide | 1,693 / 838 | 7 |
| `/destinations/gulmarg` | Gulmarg | `Gulmarg Travel Guide: Gondola,…` | Explore Gulmarg, the premier alpine meadow of Kashmir. … Gondola booking, places to visit, winter transfers, and hotels. | gulmarg travel guide / gondola | 1,756 / 671 | 6 |
| `/destinations/pahalgam` | Pahalgam | `Pahalgam Travel Guide: Betaab…` | Explore Pahalgam, the valley of shepherds in Kashmir. … union cabs, places to visit, riverside stays, and weather. | pahalgam travel guide | 1,374 / 543 | 6 |
| `/destinations/sonamarg` | Sonamarg | `Sonamarg Travel Guide: Thajiwas…` | Explore Sonamarg, the Meadow of Gold in Kashmir. … Zojila Pass, Zero Point, and Thajiwas Glacier. | sonamarg travel guide | 899 / 491 | 2 |
| `/destinations/doodhpathri` | Doodhpathri | `Doodhpathri Travel Guide: Valley…` | Explore Doodhpathri, the Valley of Milk in Kashmir. … day trips, the Shaliganga River, things to do, and weather. | doodhpathri travel guide | 881 / 468 | **0** |
| `/destinations/yusmarg` | Yusmarg | `Yusmarg Travel Guide: Meadow of…` | Explore Yusmarg, the Meadow of Jesus in Kashmir. … Doodhganga River, Nilnag Lake, and weather. | yusmarg travel guide | 791 / 480 | **0** |
| `/destinations/gurez-valley` | Gurez Valley | `Gurez Valley Travel Guide:…` | Explore Gurez Valley, Kashmir's ultimate offbeat frontier. … Razdan Pass, army checkpoints, guesthouses, and weather. | gurez valley travel guide | 903 / 530 | 1 |
| `/destinations/leh` | Leh | `Leh Travel Guide: Monasteries,…` | Explore Leh, the heart of Ladakh. … acclimatization, places to visit, restricted area permits, and weather. | leh travel guide | 860 / 597 | 1 |

### 4.10 Activity pages (8, all published)

File: `src/app/(public)/activities/[slug]/page.tsx`. Type: activity. Commercial: **Yes-enquiry** (priced, activity is booked via WhatsApp/lead; tour cards cross-sell).
**CTAs (all 8):** sidebar **"Enquire Now"** (form), WhatsApp ×4–12, per-tour **"Book Now"** → tour, **"View Details"** → sibling activity, tabs *Overview · Highlights · Pricing*. **Price:** `Activity.price` shown as "From ₹N / person" + `pricingGuide` HTML; cross-sell tour prices. **Schema:** TravelAgency, BreadcrumbList, TouristAttraction (+ImageObject on Shikara); no Offer/price schema; no FAQPage (0 activity FAQs).

| Route | H1 | Title | Meta description | Reads as | Rendered / editorial | Price |
|---|---|---|---|---|---|---|
| `/activities/gulmarg-gondola-ride` | Gulmarg Gondola Ride | `Gulmarg Gondola Ride: Phases,…` | Plan your Gulmarg Gondola ride. Discover Phase 1 and Phase 2 routes, ticket booking, best times to ride, and safety tips from local experts. | gulmarg gondola ride/ticket | 1,069 / 594 | ₹810 |
| `/activities/skiing-in-gulmarg` | Skiing in Gulmarg | `Skiing in Gulmarg Guide: Slopes,…` | Plan your ultimate skiing trip to Gulmarg. Discover beginner slopes, advanced backcountry bowls, ski rentals, certified instructor rates, and safety tips. | skiing in gulmarg | 820 / 419 | ₹700 |
| `/activities/snowmobile-gulmarg` | Snowmobile Ride in Gulmarg | `Gulmarg Snowmobile Ride Guide:…` | Plan your high-speed snowmobiling adventure in Gulmarg. … local union rates … winter safety tips. | gulmarg snowmobile | 784 / 380 | ₹2,000 |
| `/activities/helicopter-joyride-gulmarg` | Gulmarg Helicopter Joyride | `Gulmarg Helicopter Joyride…` | Plan your ultimate aerial helicopter ride in Gulmarg. … high-altitude snow landings … | gulmarg helicopter | 744 / 425 | none ("on request") |
| `/activities/atv-ride-gulmarg-doodhpathri` | ATV Ride in Gulmarg & Doodhpathri | `ATV Ride in Gulmarg &…` | Plan your ultimate ATV quad biking adventure in Gulmarg and Doodhpathri. … | gulmarg atv | 908 / 449 | ₹2,000 |
| `/activities/shikara-ride` | Shikara Ride on Dal Lake | `Srinagar Dal Lake Shikara Ride…` | Plan your iconic Dal Lake Shikara ride. Discover the best routes, official tourist taxi stand rates, peak sunset timings … | dal lake shikara ride | 895 / 461 | ₹1,000 |
| `/activities/pony-ride-pahalgam-gulmarg` | Pony Ride in Pahalgam & Gulmarg | `Pahalgam & Gulmarg Pony Ride…` | Plan your traditional pony ride in Pahalgam and Gulmarg. … Baisaran Valley routes … | pahalgam pony ride | 821 / 403 | ₹1,000 |
| `/activities/river-rafting-pahalgam` | River Rafting on the Lidder | `Lidder River Rafting in Pahalgam…` | Plan your ultimate river rafting adventure in Pahalgam. … | pahalgam river rafting | 637 / 402 | none ("on request") |

### 4.11 Blog (6 published, 0 drafts)

File: `src/app/(public)/blog/[slug]/page.tsx`. Type: blog. Commercial: **Info** with tour cross-sell (3 related tours each). **CTAs (all 6):** header/footer set; **"Request Free Itinerary"** (form); "Subscribe" (newsletter); inline "enquire now" (no destination); per-tour **"Book Now"** / **"Customize this trip"** → tour page; in-page anchor links. **Price:** only inside related-tour cards (`Tour.priceFrom`) and in the cost guide's prose. **Schema:** TravelAgency, **BlogPosting**, BreadcrumbList (no FAQPage — 0 blog FAQs).

| Route | H1 | Title | Meta description | Reads as | Rendered / editorial |
|---|---|---|---|---|---|
| `/blog/kashmir-tour-packages-complete-guide` | Kashmir Tour Packages – Complete Guide | `Kashmir Tour Packages: Complete…` | Plan a perfect, stress-free trip to Kashmir. Discover the ideal itineraries, hotel categories, local taxi union rules, and seasonal tips … | kashmir tour packages (informational) | 3,081 / 2,487 |
| `/blog/kashmir-trip-cost-budget-guide` | Kashmir Trip Cost Guide | `Kashmir Trip Cost Guide:…` | Plan your Kashmir trip budget. Discover realistic costs for flights, hotels, taxi union fares, Gondola rides, and meals … | kashmir trip cost | 3,004 / 2,400 |
| `/blog/best-time-to-visit-kashmir` | Best Time to Visit Kashmir | `Best Time to Visit Kashmir:…` | Discover the best time to visit Kashmir. Learn about the spring tulips, summer escapes, golden autumn foliage, and winter snow … | best time to visit kashmir | 2,608 / 2,005 |
| `/blog/is-kashmir-safe-for-tourists` | Is Kashmir Safe for Tourists? | `Is Kashmir Safe for Tourists?…` | Get the honest, ground-reality facts about safety in Kashmir. … | is kashmir safe | 2,001 / 1,430 |
| `/blog/kashmir-honeymoon-planning-guide` | Kashmir Honeymoon Guide | `Kashmir Honeymoon Guide:…` | Plan a romantic, stress-free honeymoon in Kashmir. … | kashmir honeymoon guide | 2,318 / 1,748 |
| `/blog/kashmir-family-travel-planning-guide` | Kashmir Family Travel Guide | `Kashmir Family Travel Guide:…` | Plan a stress-free family trip to Kashmir. … | kashmir family trip | 2,267 / 1,687 |

`/blog/author/owais-wani` (author archive) is live and linked from posts; unknown authors return "Author Not Found" (noindex).

### 4.12 Utility, trust, legal, B2B, careers, booking

| Route | Type | Commercial? | H1 | Title | Reads as | Words | CTAs (page-specific) | Price | Schema |
|---|---|---|---|---|---|---|---|---|---|
| `/about` | Utility/trust | Info | Born in Kashmir. Built on Trust. | `About Us — Local Kashmir Travel…` | about vertex kashmir holidays | 1,126 | "Request Free Itinerary" (form), WhatsApp ×2, FAQ accordions | No | +BreadcrumbList, FAQPage, people |
| `/reviews` | Utility/trust | Info | Customer Reviews & Ratings | `Customer Reviews & Ratings —…` | vertex kashmir reviews | 1,561 | "Request Free Itinerary", WhatsApp, ▶ video reviews | No | +BreadcrumbList, Organization reviews |
| `/contact` | Utility | Yes-enquiry | We're Here When You Need Us | `Contact Us — Plan Your Kashmir…` | contact / plan trip | 739 | **"Send Message"** (contact form), "Request Free Itinerary", `tel:` ×2, WhatsApp ×6 | No | +BreadcrumbList, FAQPage, ContactPage |
| `/faq` | Utility | Info | Frequently Asked Questions | `Frequently Asked Questions —…` | kashmir tour faq | 2,837 | "Request Free Itinerary", WhatsApp | No | +BreadcrumbList, FAQPage |
| `/b2b-travel-partner-program` | Utility (B2B) | Info (partner sign-up; not a consumer sale) | B2B Travel Partner Program — Kashmir DMC for Travel Agencies & Tour Operators | `B2B Travel Partner Program | Kashmir DMC` | kashmir dmc for agents | 2,371 | **"Register as B2B Partner"**, "Start Your Application", WhatsApp ×4, `tel:` | ₹ figures in partner-terms copy | +BreadcrumbList, FAQPage |
| `/careers`, `/careers/sales-executive-female` | Utility | Info | Join Our Team / Sales Executive (Female) | `Careers` / `Sales Executive (Female) —…` | jobs | 64 / 548 | "Verify Email", "Submit Application" | No | +BreadcrumbList |
| `/terms-and-conditions`, `/privacy-policy`, `/refund-and-cancellation` | Legal | Info | (page name) | (page name) | — | 817 / 587 / 588 | none | No | +BreadcrumbList |
| `/booking` (checkout) | Checkout | Yes-book | (no H1 until params) | `Complete Your Booking` | — | — | payment (Razorpay) | Tour price × pax | TravelAgency only; **noindex** |
| `/booking/success`, `/booking/failed` | Post-payment | — | — | — | — | — | — | — | `robots.ts` disallows |

---

## A. Tour packages

Source: `Tour` table (13 rows). Price = `priceFrom`, **per person**, at `minPersons`. Was = `priceWas` (struck through on page). "Shown %" = `discountPct` badge; "Real %" = computed from the two prices.

| Name (DB title) | Slug | Price / was (per person) | Min pax | Duration (`duration` days / title) | Destinations | Published | Shown % / real % |
|---|---|---|---|---|---|---|---|
| Luxury Kashmir Honeymoon Package | `luxury-kashmir-honeymoon-package-5n-6d` | ₹21,500 / ₹34,900 | 2 | 6 d / 5N 6D | Srinagar, Gulmarg, Pahalgam | ✅ | 24 / **38** |
| Premium Kashmir Tour Package \| 6 Nights 7 Days | `premium-kashmir-tour-package-6n-7d` | ₹25,999 / ₹37,500 | 2 | 7 d / 6N 7D | Srinagar, Gulmarg, Pahalgam | ✅ | 24 / **31** |
| Kashmir Group Tour Package \| 5 Nights 6 Days | `kashmir-group-tour-package-5n-6d` | ₹12,999 / ₹19,500 | **7** | 6 d / 5N 6D | Srinagar, Gulmarg, Pahalgam | ✅ | 25 / **33** |
| Kashmir Family Tour Package - 5 Nights 6 Days | `kashmir-family-tour-package-5n-6d` | ₹18,499 / ₹24,500 | 3 | **5 d** / 5N 6D ⚠ | Srinagar, Sonamarg, Pahalgam, Gulmarg | ✅ | 24 / 24 |
| Kashmir Budget Tour Package \| 5 Nights 6 Days | `kashmir-budget-tour-package-4n-5d` ⚠ slug | ₹11,999 / ₹15,500 | **4** | 6 d / 5N 6D | Srinagar, Gulmarg, Sonamarg, Pahalgam | ✅ | 25 / 23 |
| Vaishno Devi Kashmir Tour Package \| 6 Nights 7 Days | `vaishno-devi-kashmir-tour-package-6n-7d` | ₹24,999 / ₹26,000 | 3 | 7 d / 6N 7D | Srinagar, Gulmarg, Pahalgam (start: Jammu/Katra) | ✅ | 25 / **4** |
| Gurez Valley Tour Package \| 4 Nights 5 Days | `gurez-valley-tour-package-4n-5d` | ₹16,499 / ₹22,000 | 2 | 5 d / 4N 5D | Srinagar, Gurez Valley | ✅ | 25 / 25 |
| Leh Ladakh Adventure Tour Package \| 6 Nights 7 Days | `leh-ladakh-adventure-tour-package-6n-7d` | ₹24,499 / ₹32,000 | 3 | 7 d / 6N 7D | Leh | ✅ | 23 / 23 |
| Kashmir LOC Border Adventure Tour \| 4 Nights 5 Days | `kashmir-loc-border-adventure-tour-4n-5d` | ₹15,499 / ₹21,000 | 1 | 5 d / 4N 5D | Srinagar | ❌ | — |
| Manali Tour Package – 3 Days / 2 Nights | `manali-tour-package-3-days-2-nights` | ₹8,000 / — | 1 | 3 d | (none linked) | ❌ (region HIMACHAL, 4 package options, inquiry-only) | — |
| Christmas Special – 5 Nights 6 Days (hidden CRM tour) | `offer-christmas-kashmir-tour-package-2026-196v8e` | ₹21,000 | 1 | 6 d | (none) | ❌ internal | — |
| Diwali Special – 5 Nights 6 Days (hidden CRM tour) | `offer-diwali-kashmir-tour-package-2026-yw99pi` | ₹21,000 | 1 | 6 d | (none) | ❌ internal | — |
| New Year Special – 5 Nights 6 Days (hidden CRM tour) | `offer-new-year-kashmir-tour-2027-idqera` | ₹21,000 | 1 | 6 d | (none) | ❌ internal | — |

Other facts about the 8 published tours:
- **Reviews:** 6 Kashmir tours show rating 5.0 with `reviewCount = 2` (2 review rows each). Leh Ladakh and Gurez have 0 reviews and rating 0. These feed `Product.aggregateRating`.
- **FAQs:** 0 published on every tour.
- **Itinerary days on file:** 6–7 for the Kashmir circuits; Gulmarg appears on 1–2 days of six of them; none for Leh/Gurez.
- **Collections:** the 7 Kashmir/Gurez tours sit in `kashmir-tour-packages`; Gurez is also in `kashmir-offbeat-packages`; Leh in `leh-ladakh-tour-packages`.
- `bestTime` on the honeymoon, premium, group and family tours literally reads "December to February for snow-covered alpine landscapes"; Leh and Gurez say "late spring to early autumn".
- **Sellable products that are not `Tour` rows:** 3 occasion offers × 4 tiers (₹21,000 / 32,000 / 45,000 / 65,000 for 2), 3 adventure campaigns (tiers above), 8 activities (₹700–₹2,000, two "on request").

---

## B. Destination and activity pages — thin content (<300 words)

Threshold 300 words. Two measures: **editorial** (DB fields, HTML stripped) and **rendered** (page text incl. cards).

**Destinations (8):** none is thin on either measure.

| Destination | Editorial | Rendered | | Destination | Editorial | Rendered |
|---|---|---|---|---|---|---|
| Srinagar | 838 | 1,693 | | Doodhpathri | **468** (lowest) | 881 |
| Gulmarg | 671 | 1,756 | | Yusmarg | 480 | 791 |
| Pahalgam | 543 | 1,374 | | Gurez Valley | 530 | 903 |
| Sonamarg | 491 | 899 | | Leh | 597 | 860 |

**Activities (8):** none is thin. Editorial 380–594 (Snowmobile 380 lowest, Gondola 594 highest); rendered 637–1,069 (River Rafting 637 lowest).

**Pages under 300 rendered words elsewhere (thin):**

| Page | Rendered | Note |
|---|---|---|
| `/offers` | **107** | hub with 3 cards, no body text |
| `/careers` | 64 | utility |
| `/blog` | 157 | listing (cards render client-side) |
| `/adventures` | 280 | listing |
| Collection editorial body (`TourCollection.content`) | **72** (Kashmir), 70 (Leh), 51 (Offbeat), 184 (Himachal) | rendered totals are higher only because of cards |

**Structurally thin content (not a word count):**
- Christmas and New Year offer pages: overview, why-this-offer, inclusions, exclusions and FAQ are all empty; itinerary text is ~6 words in total (vs Diwali's 310).
- Destinations Doodhpathri and Yusmarg link to **0** tours; no page for Ladakh sub-places (Nubra, Pangong) or Jammu/Katra even though tours reference them.
- Activities have 0 FAQs each; River Rafting links to only one tour (Premium).

---

## C. Orphaned or weakly-linked pages

Method: `href` extraction from server HTML of 72 crawled pages; a link present on ≥90 % of pages counts as "chrome". Client-rendered menus (Tours ▾ collections, Offers ▾) and `/blog` cards are not in server HTML, so they were checked in source instead.

**Truly unreachable from navigation or other pages**
| Page | Why |
|---|---|
| `/tours/category/luxury-tour-packages` | No LUXURY tour → shell page, `noindex`, not in sitemap or footer; only self-references |
| `/tours/kashmir-loc-border-adventure-tour-4n-5d`, `/tours/manali-…` | Unpublished → "Not Found" (also not in sitemap) |
| `/himachal-tour-packages` | Published collection with no live tours → 404 |

**Reachable only through one narrow path**
| Page | Only linked from |
|---|---|
| `/kashmir-tour-packages` (and other collections) | Tours ▾ dropdown (client-rendered) and the 3 offer pages. **Not** on home, `/tours`, footer, or the live sitemap snapshot |
| `/offers/*` | Offers ▾ dropdown, `/offers` hub, each other. Not on home body or footer (`/offers` itself is in the header) |
| `/adventures/*` (3) | `/adventures` listing only; `/adventures` itself is footer-only. These pages have no navbar/footer, so they are also dead-ends outward |
| `/blog/kashmir-tour-packages-complete-guide` | `/blog` listing (client-rendered cards) only — 0 in-body links from any other page |
| `/destinations/yusmarg`, `/destinations/gurez-valley` | `/destinations` listing only (1 inbound each); `/destinations/leh` 2 |
| `/tours/category/budget-…`, `/premium-…` | `/tours`, `/tours/category` only (2 inbound); adventure & pilgrimage 3; only Honeymoon/Family/Group are in the footer |
| `/careers/sales-executive-female` | `/careers` only |

**Not orphaned but absent from `sitemap.ts` (code):** `/activities`, `/plan-your-kashmir-trip` (both linked from nav/footer). **In code but missing from today's live sitemap:** `/offers`, offers, all collections (cache lag).

---

## D. Five pages best suited for paid traffic today (30 Sep)

Ranked for a Nov–Feb window. Each has a price, a reachable conversion path and live status. "Missing" is the single biggest gap I saw, judged against sending paid clicks.

| # | Page | Why it qualifies | Single biggest thing missing |
|---|---|---|---|
| 1 | `/offers/diwali-kashmir-tour-package-2026` | The only fully written offer: fixed dates (6–11 Nov), 4 priced tiers, itinerary, inclusions/exclusions, 10 FAQs, a reviews section. **Window closes in ~37 days.** | **No named hotels on any tier** (hotel rows read "Comfort Hotel or similar"), so a ₹21,000 vs ₹65,000 tier can't be compared by property; also no overview text and auto-generated meta description |
| 2 | `/offers/new-year-kashmir-tour-2027` | Highest-intent winter date (28 Dec–2 Jan), priced tiers, snow add-ons (skiing/sledge/pony), lead form + WhatsApp | **Inclusions/Exclusions, "why", FAQ and overview are empty in the DB** — the page doesn't say what ₹21,000–₹65,000 covers |
| 3 | `/offers/christmas-kashmir-tour-package-2026` | 22–27 Dec, same structure and prices as New Year | Same gap as #2; also identical prices to New Year and Diwali (₹21,000/32,000/45,000/65,000) with no date-specific premium visible |
| 4 | `/tours/luxury-kashmir-honeymoon-package-5n-6d` | Only online-bookable page with a winter angle in its copy (`bestTime` "Dec–Feb snow"), ₹21,500 pp, 10 % advance, WhatsApp + form, Product schema | **Shows "24 % OFF" but ₹34,900 → ₹21,500 is 38 %**, and social proof is 2 reviews; the ad-facing discount claim doesn't match the price shown |
| 5 | `/plan-your-kashmir-trip` | Existing Ads landing page (keyword-aligned copy), packages + quote form + WhatsApp, ₹ prices | **Only the sitewide `TravelAgency` schema and the same title as the homepage** (`Kashmir Tour Packages & Kashmir…`); nothing on the page speaks to Nov–Feb travel (0 mentions of "winter"/"snow") |

Considered but not chosen: `/kashmir-tour-packages` (live, priced, but 72 words of editorial and state is changing today); `/tours/kashmir-tour-packages-from/delhi` (good intent match, no winter/seasonal angle); the three `/adventures/*` pages (batch tables show expired dates as bookable; season Jun–Oct).

---

## E. Winter-relevant pages (Nov–Feb)

### Exist
| Topic | Page(s) | Note |
|---|---|---|
| Gulmarg | `/destinations/gulmarg` (1,756 words, season "Apr–Jun, Dec–Mar", mentions winter transfers, FAQPage); activity pages below; Gulmarg is on the itinerary of 6 of 8 published tours | No Gulmarg-centred tour or collection |
| Snow | `/activities/snowmobile-gulmarg` (₹2,000), `/activities/helicopter-joyride-gulmarg` ("high-altitude snow landings"); Christmas / New Year offer add-ons (skiing, sledge, pony); `/blog/best-time-to-visit-kashmir` (winter section, 2,005 words) | No dedicated snow/winter page |
| Skiing | `/activities/skiing-in-gulmarg` (₹700, 812 words) | Guide-style; no ski package |
| Gondola | `/activities/gulmarg-gondola-ride` (₹810, 1,061 words) | Guide-style; 12 WhatsApp links, "Enquire Now" |
| New Year | `/offers/new-year-kashmir-tour-2027` | Content gaps in §D |
| Christmas | `/offers/christmas-kashmir-tour-package-2026` | Content gaps in §D |
| Diwali (Nov) | `/offers/diwali-kashmir-tour-package-2026` | Fully written |
| Honeymoon | `/tours/category/honeymoon-packages`, `/tours/luxury-kashmir-honeymoon-package-5n-6d`, `/blog/kashmir-honeymoon-planning-guide` (1,748 words) | Only **one** honeymoon tour; not winter-specific |

### Do not exist (given Nov–Feb demand)
- A **winter / snowfall Kashmir tour-package page or collection** (existing collections: Kashmir, Leh-Ladakh, Offbeat, Himachal — none seasonal).
- A **Gulmarg tour package / Gulmarg snow package** page (Gulmarg has a guide, not a sellable package).
- A **ski / skiing holiday package** (only the ₹700 activity guide).
- A **short (3N/4N) Srinagar–Gulmarg winter tour** — the shortest published Kashmir circuit is 5N/6D; Gurez (4N/5D) and Leh Ladakh say "late spring to early autumn" in their own `bestTime`.
- A **winter honeymoon** page or a second honeymoon package; a **Valentine's / January–February dated offer** (offers exist only for Diwali, Christmas, New Year).
- **Month / condition content:** "Kashmir in December / January / February", snowfall timing, winter packing list, Srinagar–Gulmarg road/gondola winter status (only a FAQ line and destination tips).
- **Winter coverage of Pahalgam / Sonamarg:** their destination pages give seasons "Apr–Oct" and "Jun–Sep" and don't address winter visits.
- **Hotel / houseboat pages** — none exist (only an admin-only supplier table), so "Gulmarg hotels in winter" style intent has no page.
- **Kashmir winter packages by origin city** — the five city pages carry no winter/seasonal content.

---

## Appendix — probes returning no page

`/skiing`, `/gulmarg-skiing`, `/kashmir-honeymoon-packages`, `/himachal-tour-packages` → 404. `/blog/author/farooq` → "Author Not Found" (noindex).
