# Vertex Kashmir Holidays — Design System

Authoritative reference for brand, color, and typography. New UI should be built from
these tokens rather than one-off arbitrary values. Source of truth for each:

- Brand/logo: `public/brand/README.md` + `public/brand/Vertex-Logo-Kit-Preview.html`
- Color tokens: `src/app/globals.css` (`:root` / `.dark`) + `tailwind.config.ts`
- Type scale: `tailwind.config.ts` (`theme.extend.fontSize`) + this doc

## Brand

| Token        | Hex       | Use                                                           |
| ------------ | --------- | ------------------------------------------------------------- |
| Brand Navy   | `#0B1F3A` | "Vertex" wordmark, dark surfaces, primary text on light theme |
| Brand Blue   | `#0A4DA2` | Mark — left facet                                             |
| Brand Green  | `#0BA45B` | Mark — right facet, tagline, CTA accents                      |
| Green (dark) | `#16B364` | Tagline on dark backgrounds                                   |

- Display/wordmark typeface: **Playfair Display** SemiBold
- Tagline & UI typeface: **Inter** SemiBold (tracked caps for tagline)
- Logo 1 (icon mark) → favicon, PWA icons, loading screen, admin
- Light surfaces → horizontal/stacked **light** lockup (navy wordmark); dark surfaces → **dark** lockup (white wordmark)
- Clear space ≥ height of the icon mark on all sides; minimum size 120px wide (horizontal), 28px (icon)
- Never recolour, stretch, rotate, or add effects to the mark

Full usage rules: `public/brand/README.md`.

## Color

Semantic tokens (`globals.css`) — HSL triplets consumed via Tailwind's `hsl(var(--token) / <alpha-value>)`, so every one supports opacity modifiers (`bg-primary/20`). Light is default (`:root`); `.dark` overrides.

| Token                        | Light                                   | Dark                      | Use                                        |
| ---------------------------- | --------------------------------------- | ------------------------- | ------------------------------------------ |
| `background` / `foreground`  | `#F8F1DD` / `#0B1F3A`                   | `#0B1F3A` / `#F3ECD9`     | Page background / body text                |
| `card` / `card-foreground`   | `#FEFBF2` / navy                        | `#102A4A` / `#F3ECD9`     | Card surfaces                              |
| `muted` / `muted-foreground` | `#F0E6CC` / darkened for WCAG AA ≥4.5:1 | `#0F2A45`-ish / `#9FB0C4` | Secondary surfaces, de-emphasized text     |
| `border` / `input`           | `#E7DABB`                               | `#1C3A60`                 | Hairlines, form borders                    |
| `primary`                    | navy `#0B1F3A`                          | gold `#D9BE7A`            | Primary text/ink accents (flips per theme) |
| `accent`                     | green `#0BA45B`                         | green `#16B364`           | CTA buttons, success/positive accents      |
| `link`                       | blue `#0A4DA2`                          | blue `#3D7AD6`            | Inline links                               |
| `gold`                       | `#C2A14E`                               | `#D4B978`                 | Ratings, premium/gold accents              |

Brand-specific palette (`tailwind.config.ts`, not theme-flipping — for fixed-context sections like the golden Tours theme or navy Home dark-mode sections):

| Group     | Tokens                                                                                                 | Use                             |
| --------- | ------------------------------------------------------------------------------------------------------ | ------------------------------- |
| `green.*` | `brand` `deep` `bright` `glow`                                                                         | CTA greens across contexts      |
| `navy.*`  | `brand` `soft`                                                                                         | Dark navy surfaces              |
| `brand.*` | `navy` `gold` `blue` `green` `green2` `bright` `mint` `ink` `mute` `page` `line` `dark` `cream` `sand` | Tours page's fixed golden theme |
| `badge.*` | `orange` `blue` `green`                                                                                | Status/category badges          |

Always prefer the semantic tokens (`background`, `foreground`, `primary`, `accent`, `border`, `muted`) for anything that should adapt between light/dark. Reach for the brand-specific palette only for sections that are intentionally fixed to one visual theme regardless of site dark mode (e.g. Tours' golden palette).

## Typography

**Families**

- `font-display` / `.h-display` → Playfair Display — headings, hero titles, brand moments
- `font-sans` (default body) → Inter — everything else

**Type scale** — normalized 2026-07, **strictly even steps only** (matches Tailwind's own original ladder shape — 12/14/16/18/20/24 — the standard industry pattern vs. an every-integer or half-px scale). Previously this codebase had ~35 distinct arbitrary font sizes differing by as little as 0.5px (organic accretion, not a designed scale). This is the current, intentional scale — extend it deliberately, in steps of 2, rather than reaching for a new arbitrary value. No odd-numbered font size should exist anywhere in the codebase.

| Token                                    | rem        | px      | Typical use                                                                             |
| ---------------------------------------- | ---------- | ------- | --------------------------------------------------------------------------------------- |
| `text-[10px]`                            | 0.625rem   | 10px    | Smallest micro-badges/pills only                                                        |
| `text-[12px]`                            | 0.75rem    | 12px    | Captions, tiny meta, dense table cells                                                  |
| `text-xs` (Tailwind default, overridden) | 0.875rem   | 14px    | Badges, form helper text, secondary body                                                |
| `text-[14px]`                            | 0.875rem   | 14px    | Same step as `text-xs` — arbitrary form used where a Tailwind class doesn't fit cleanly |
| `text-sm` (Tailwind default, overridden) | 1rem       | 16px    | Default UI/body text — most common size site-wide                                       |
| `text-[16px]` / `text-base`              | 1rem       | 16px    | Lead/emphasized body text — same step as `text-sm` (see note below)                     |
| — (section-heading anchor)               | 1.125rem   | 18px    | **H2 section headings, fixed, no responsive scaling** — one clear step above body text  |
| `text-xl`+                               | 1.25rem+   | 20px+   | Card headings, stat numbers — untouched by this pass                                    |
| H1 hero tier                             | responsive | 44–52px | Page hero titles only                                                                   |

**One deliberate overlap (not an odd-number exception):**
`text-sm` (16px) now equals `text-base` (16px). Keeping the ladder purely even and bumping `sm` by a full 2px step from its original 14px lands it on 16 — the same value as `base`. This is a real overlap, not a bug: the two classes remain semantically distinct in code (dense/secondary vs. lead text) even though they currently render identically. If this ever needs visual separation, bump `base` too (16→18) — deliberately not done yet, since `base` would then collide with the section-heading anchor instead.

**Established conventions (do not re-litigate without reason):**

- **H2 section headings** (Home/About/Contact/Tours/Activities/Destinations, and Tour/Destination detail pages) use a **fixed** `text-[18px] font-bold`, identical on mobile and desktop — no `sm:`/`lg:` scaling. Chosen over 16px specifically so headings stay visibly distinct from body text (16px) rather than colliding with it; chosen over the site's older 17px anchor to keep the scale strictly even. Matches Tailwind's own `lg` step, so it isn't a one-off value either.
- **H1 hero titles** (page banners built on `SecondaryHero`) use a responsive 3-step scale: `text-3xl sm:text-4xl lg:text-[44px]` (up to `lg:text-[52px]` for About). Every hero H1 should follow this exact pattern. (H1 sizes were already all even before this pass — 44/48/52px — no change needed there.)
- `tailwind.config.ts` overrides only `xs` (12→14px) and `sm` (14→16px) — the two sizes that read as genuinely too small, each bumped a full even step. `base`/`lg`/`xl`+ are Tailwind defaults, unchanged.
- Arbitrary `text-[Npx]` values were remapped to a clean even ladder end to end: 10px (unchanged), 12px (was 11–12px), 14px (was 13–14px), 16px (was 15–16px), 18px (was 17–18px, the section-heading anchor), 20px (was 19–20px), 22px (was 21–22px), 24px (was 23–24px). Everything 24px and above was already even and untouched.

**Usage rule:** when a design needs a size, use an existing scale step first. If nothing fits, add the new step to this table (and to `tailwind.config.ts` if it should become a named token) rather than writing a new one-off `text-[Npx]` value — that's exactly the fragmentation this doc exists to prevent.

## Out of scope

Three places use `fontSize` outside this system entirely and are intentionally not covered:

- `src/components/contact/ContactOfficeMap.tsx` — decorative inline SVG map labels
- `src/components/admin/RevenueChart.tsx` — chart axis tick labels (Recharts, not Tailwind)
- `src/components/admin/itinerary/ItineraryPdf.tsx` — a `@react-pdf/renderer` StyleSheet for PDF export, a different rendering system entirely
