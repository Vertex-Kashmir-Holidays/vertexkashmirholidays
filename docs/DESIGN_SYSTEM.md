# Vertex Kashmir Holidays — Design System

Authoritative reference for brand, color, typography, spacing, radius, shadow,
breakpoints, and motion timing. New UI should be built from these tokens rather
than one-off arbitrary values. Source of truth for each:

- Brand/logo: `public/brand/README.md` + `public/brand/Vertex-Logo-Kit-Preview.html`
- Color tokens: `src/app/globals.css` (`:root` / `.dark`) + `tailwind.config.ts`
- Type scale: `tailwind.config.ts` (`theme.extend.fontSize`) + this doc
- Spacing / breakpoints: Tailwind's unmodified defaults + this doc
- Radius / shadow: `tailwind.config.ts` (`theme.extend.borderRadius` / `boxShadow`) + this doc
- Motion timing: `src/lib/motion.ts` (framer-motion) + `--ease-brand` (`globals.css`) + `ease-brand` (`tailwind.config.ts`) + this doc

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

## Spacing

No custom Tailwind spacing scale exists — `tailwind.config.ts` has no `spacing` key, so every `p-*`/`m-*`/`gap-*` utility is Tailwind's own default scale. This is already the de facto convention codebase-wide (arbitrary `p-[Npx]` appears in only ~59 files out of the full component tree, almost entirely for genuine one-offs — safe-area insets, a precise hero pixel offset — not general layout spacing).

**Usage rule:** reach for the default scale first (`p-4`, `gap-6`, `mt-10`, …). Arbitrary bracket values are reserved for a real one-off that doesn't map to any scale step (e.g. `pb-[calc(0.75rem+env(safe-area-inset-bottom))]` for a fixed bottom bar) — not a substitute for picking the nearest scale step.

## Radius

The established scale in use (1181 occurrences codebase-wide) is Tailwind's default `rounded-lg` through `rounded-full`, plus one added token:

| Token          | Value    | Use                                                                              |
| -------------- | -------- | --------------------------------------------------------------------------------- |
| `rounded-xl`   | 0.75rem  | Buttons, inputs, small cards                                                     |
| `rounded-2xl`  | 1rem     | Standard card/panel surfaces — the most common container radius site-wide       |
| `rounded-3xl`  | 1.5rem   | Larger feature cards, hero panels                                               |
| `rounded-4xl`  | 2rem     | Large glass/CTA panels (Footer newsletter card, promo banners, film thumbnails) |
| `rounded-full` | 9999px   | Pills, avatars, icon badges                                                      |

`rounded-4xl` was added to `tailwind.config.ts` to formalize `rounded-[2rem]`, which had been hand-copied identically across 5 components — same value, now one named token instead of a repeated arbitrary one.

**Usage rule:** use an existing step first; only add a new named step to `tailwind.config.ts` (and this table) if a genuinely new radius is needed — don't reach for a fresh `rounded-[Npx]`.

## Shadow

A named `boxShadow` scale already exists in `tailwind.config.ts` — it just hadn't been documented:

| Token               | Use                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| `shadow-glass`      | Frosted glass panels (CTA banners, hero lead cards) — pairs with `.glass-strong`/`.glass-cream` |
| `shadow-glow`       | Primary CTA button hover accent (a soft brand-green bloom)                |
| `shadow-card`       | Standard elevated card/tile surface                                       |
| `shadow-soft`       | A subtler card elevation — form panels, info cards, default tour-card state |
| `shadow-card-tours` | Defined but **currently unused** anywhere in the codebase — a candidate for removal or its first real use, not a gap to silently fill |
| `shadow-gold`       | Gold/premium CTA hover glow (pricing, booking accents)                    |

**Known gap:** 3 fixed bottom-bar components each hand-copy a *different* arbitrary shadow instead of using a shared token — `src/components/tours/BookingMobileBar.tsx`, `src/components/admin/MobileBottomTabs.tsx`, `src/components/account/AccountShell.tsx` (differing blur radius and opacity per file). Left as-is deliberately: whether these should visually match is a design decision, not something this doc should silently decide by forcing them to one value. Flagging here so the next person who touches one of these doesn't assume the difference is accidental without checking.

**Usage rule:** use a named shadow token first; a new `shadow-[...]` arbitrary value is a signal either an existing token fits after all, or a new named step belongs in `tailwind.config.ts`.

## Breakpoints

No `screens` override exists in `tailwind.config.ts` — pure Tailwind v3 defaults:

| Token | Min width | Use                                                    |
| ----- | --------- | ------------------------------------------------------- |
| `sm`  | 640px     | Small phone → large phone adjustments                   |
| `md`  | 768px     | Tablet portrait                                         |
| `lg`  | 1024px    | **Primary mobile/desktop split** — the codebase's `lg:hidden`/`lg:block` pattern (fixed bottom bars, mobile nav) treats this as the real breakpoint, not `md` |
| `xl`  | 1280px    | Desktop content-width adjustments                        |
| `2xl` | 1536px    | Large desktop                                            |

**Usage rule:** use the Tailwind defaults as-is; don't override `screens` in `tailwind.config.ts` without a strong reason — none of the current design needs a non-standard breakpoint.

## Motion

The framer-motion easing curve `[0.22, 1, 0.36, 1]` (an "ease-out-expo"-style curve) is the one motion value used consistently sitewide for entrance/reveal animations. Before this doc, it was hand-copied inline in 23+ separate component files with no shared source. It now has exactly one canonical definition, exposed three ways for the three ways it gets consumed:

| Consumption path         | Source                                                    | Use                                                    |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------- |
| framer-motion (JS)       | `EASE_BRAND` — `src/lib/motion.ts`                        | Any `motion.*` component's `transition={{ ease: ... }}` |
| Tailwind utility (CSS)   | `ease-brand` — `tailwind.config.ts` `transitionTimingFunction.brand` | Plain CSS transitions on non-framer-motion elements (e.g. `Navbar.tsx`'s scroll-state transition) |
| Raw CSS custom property  | `--ease-brand` — `src/app/globals.css` `:root`            | Keyframe animations declared in `globals.css` (`.hero-reveal`/`.hero-reveal-x`) |

Durations and delays are **not** centralized — they vary intentionally per component (a hero reveal might run 1.5s, a card stagger 0.4s) and were never actually duplicated the way the curve was. Reach for a value that reads right for the specific animation; there's no "wrong" duration the way a hand-copied easing array was a real, silent source of drift.

**Usage rule:** import `EASE_BRAND` from `@/lib/motion` for any new framer-motion `transition` — never hand-copy the bezier array again. Use the `ease-brand` utility class for plain CSS transitions instead of an arbitrary `ease-[cubic-bezier(...)]`.

## Out of scope

Three places use `fontSize` outside this system entirely and are intentionally not covered:

- `src/components/contact/ContactOfficeMap.tsx` — decorative inline SVG map labels
- `src/components/admin/RevenueChart.tsx` — chart axis tick labels (Recharts, not Tailwind)
- `src/components/admin/itinerary/ItineraryPdf.tsx` — a `@react-pdf/renderer` StyleSheet for PDF export, a different rendering system entirely
