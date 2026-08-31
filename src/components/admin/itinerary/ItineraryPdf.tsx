/* eslint-disable jsx-a11y/alt-text */
// PDF rendering of the itinerary using @react-pdf/renderer primitives.
// One <Page> per section; long sections wrap across physical pages.
// Text is vector (selectable); images are pre-compressed JPEG data URLs passed
// in via `images` (keyed by the original src) so the document stays under 1 MB.

import { Document, Page, View, Text, Image, Svg, Path, StyleSheet } from "@react-pdf/renderer";
import type { ItineraryData } from "@/types/itinerary";
import { PDF_CONTACT, inr } from "@/lib/pdf/contact";
import { MEAL_PLAN_LEGEND } from "@/lib/hotelSuppliers/schema";
import type { PdfTrustContent } from "@/lib/itinerary/pdfTrustContent";
import { ITINERARY_ICON_PATHS, type ItineraryIconKey } from "./icons";

// Brand assets. Each data URL is supplied through the `images` map (keyed by
// these paths). The icon doubles as the faint per-page watermark; the
// horizontal lockups are the primary logo — dark-bg (white text) variant for
// the cover/thank-you pages, light-bg (dark text) variant for the body header.
export const LOGO_SRC = "/brand/png/icon/vertex-icon-512.png";
export const LOGO_DARK_SRC = "/brand/png/horizontal/vertex-horizontal-dark-1600w.png";
export const LOGO_LIGHT_SRC = "/brand/png/horizontal/vertex-horizontal-light-1600w.png";
// Payment-partner strip on the closing page — pre-recolored for the dark
// background, transparent bg. Pre-converted to PNG (checked in alongside the
// original .webp) because react-pdf/pdfkit can't embed WebP; PNG also keeps
// the transparency, unlike the JPEG path used for photos (which mattes
// transparency to white — wrong on a dark page).
export const PAYMENT_PARTNER_SRC = "/gateway/payment-partner-dark.png";

// Every lossless brand asset the PDF embeds — the export pipeline fetches each
// as a data URL up-front (no re-encoding, so PNG transparency survives) so a
// missing one degrades gracefully instead of throwing.
export const LOGO_ASSETS = [LOGO_SRC, LOGO_DARK_SRC, LOGO_LIGHT_SRC, PAYMENT_PARTNER_SRC] as const;

const C = {
  green: "#1d5c43",
  greenDark: "#10261b",
  mint: "#6abf8e",
  lightGreen: "#e3f0e9",
  cream: "#f7f4ee",
  border: "#e4e0d8",
  ink: "#2b2b2b",
  muted: "#7a7a72",
  rose: "#e11d48",
  white: "#ffffff",
};

// Spacing scale (pt). Every gap/margin/padding added or touched below in the
// body content pulls from this scale instead of an ad-hoc number, so rhythm
// stays consistent regardless of how many days/hotels/list items the CRM
// data contains.
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36 };

// Strict cap on how many "Highlights" a single day card shows — keeps the
// block a fast scan (2x2 at most) instead of a growing list. See the
// days.map below for how this is applied (drops trailing items only, never
// rewords/reorders/invents).
const MAX_HIGHLIGHTS = 4;

// Exact hex equivalents of the admin editor's literal Tailwind arbitrary
// values (hsl(158 46% 14%), hsl(146 35% 55%)) used only on the closing page,
// so it matches ItineraryEditor.tsx's preview precisely instead of the
// slightly different C.greenDark/C.mint used elsewhere in this document.
const TY_GREEN = "#133428";
const TY_MINT = "#64b487";
// Theme's navy primary (--primary: hsl(214 68% 14%) in light mode).
const TY_NAVY = "#0b203c";

// Company contact details, reused by the page footer and the closing
// Thank-You page — sourced from the shared PDF_CONTACT (src/lib/pdf/assets.ts)
// so this never drifts from the invoice PDF's copy again.
const CONTACT = {
  ...PDF_CONTACT,
  phonePrimary: "+91-7889577789", // single number for the compact page footer
};

const s = StyleSheet.create({
  // NOTE: no page-level `lineHeight`. A unitless lineHeight here is inherited and
  // resolved against the 10pt base size, squashing every line box to ~14.5pt —
  // which makes large display text (titles, price) overlap the next element.
  // Multi-line body styles set their own lineHeight where readable spacing matters.
  page: {
    paddingTop: 58,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    color: C.ink,
    fontFamily: "Helvetica",
  },

  // Fixed brand header repeated on every physical sheet of the body page.
  header: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 8,
  },
  headerLogo: { width: 120, height: 30, objectFit: "contain" },
  headerTag: { fontSize: 7.5, color: C.muted, letterSpacing: 1 },

  // Faint centred icon watermark — sits behind body content on every sheet.
  watermark: { position: "absolute", top: 250, left: 116, width: 360, height: 360, opacity: 0.045 },
  watermarkImg: { width: 360, height: 360, objectFit: "contain" },

  footer: {
    position: "absolute",
    bottom: 14,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1.5,
    borderTopColor: C.green,
    paddingTop: 7,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 5, width: "30%" },
  footerDotMark: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.mint },
  footerBrand: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.green, letterSpacing: 0.4 },
  footerContact: { flex: 1, textAlign: "center", fontSize: 7, color: C.muted },
  footerDot: { color: C.mint, fontFamily: "Helvetica-Bold" },
  footerPage: {
    width: "30%",
    textAlign: "right",
    fontSize: 7.5,
    color: C.green,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },

  // Cover — every block is absolutely positioned over the full-bleed image so
  // the cover has zero in-flow height and can never overflow onto a 2nd page.
  cover: { padding: 0 },
  coverImg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(12,28,22,0.58)",
  },
  coverBrand: {
    position: "absolute",
    top: 44,
    left: 44,
    right: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coverTitleBlock: { position: "absolute", top: 210, left: 44, right: 44 },
  coverBottom: { position: "absolute", bottom: 44, left: 44, right: 44 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: 28, height: 28, objectFit: "contain" },
  // Horizontal brand lockup used on the cover (dark overlay) and thank-you page.
  coverLogo: { width: 188, height: 47, objectFit: "contain" },
  tyLogo: { width: 200, height: 50, objectFit: "contain" },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white },
  brandSub: { fontSize: 8, letterSpacing: 2, color: "rgba(255,255,255,0.85)" },
  coverTitle: { fontSize: 58, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 2 },
  coverScript: { fontSize: 34, color: C.mint, marginTop: 2 },
  durationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  durationText: { fontSize: 11, letterSpacing: 3, color: C.white, fontFamily: "Helvetica-Bold" },
  preparedLabel: {
    fontSize: 9,
    letterSpacing: 4,
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
  },
  preparedName: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: C.white,
    marginTop: 4,
  },
  coverGrid: {
    flexDirection: "row",
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.25)",
    paddingTop: 16,
  },
  coverGridCol: { flex: 1, paddingRight: 10, alignItems: "center", gap: 3 },
  coverGridValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textAlign: "center",
  },
  coverGridLabel: {
    fontSize: 8,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.65)",
    marginTop: 3,
    textAlign: "center",
  },
  costBox: {
    marginTop: 18,
    backgroundColor: "rgba(16,38,27,0.88)",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  costValue: { fontSize: 24, fontFamily: "Helvetica-Bold", color: C.white, textAlign: "center" },
  costLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    textAlign: "center",
  },

  // Section headings
  section: { marginBottom: 8 },
  sectionGap: { marginTop: SP.xxl },
  secHeadRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: SP.md },
  secHead: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.green },
  secLine: { flex: 1, height: 1, backgroundColor: C.border },

  centerHead: { textAlign: "center", marginBottom: 8 },
  destLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.muted, textAlign: "center" },
  destValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    textAlign: "center",
    marginTop: 2,
  },

  // Info bar
  infoBar: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: SP.md + 2,
    marginTop: SP.lg,
    marginBottom: SP.xl,
  },
  infoCell: { flex: 1, alignItems: "center", paddingHorizontal: 8, textAlign: "center" },
  infoValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    textAlign: "center",
    marginTop: 5,
  },
  infoLabel: { fontSize: 8, color: C.muted, textAlign: "center", marginTop: 2 },

  // Small circular colored background behind an icon — used wherever an icon
  // needs more visual weight/"premium chip" presence (day metadata, trust
  // strip) instead of floating bare against the page background.
  iconChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.lightGreen,
    alignItems: "center",
    justifyContent: "center",
  },

  // Day — every day renders inside the same bordered card (consistent
  // padding/radius) so a short description and a long one produce the same
  // visual container instead of one day looking structurally different from
  // the next. wrap={false} on this card (applied in JSX) keeps badge, title,
  // description, metadata and image together as one atomic pagination unit.
  // Badge↔body gap widened (was 14) — more breathing room between the day
  // number and its title, per the "increase internal card spacing ~20-25%"
  // pass.
  day: { flexDirection: "row", gap: SP.lg + 1 },
  dayCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: SP.sm + 2,
    marginBottom: SP.sm + 2,
    backgroundColor: C.white,
  },
  // Badge slightly larger (was 36) so the more-prominent day number has room
  // to breathe without crowding the circle edge.
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeKicker: { fontSize: 6.5, color: "rgba(255,255,255,0.75)", fontFamily: "Helvetica-Bold", letterSpacing: 0.6 },
  dayBadgeNum: { fontSize: 16, color: C.white, fontFamily: "Helvetica-Bold", marginTop: 1 },
  dayBody: { flex: 1 },
  dayTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink },
  // Title→description gap and description line-height both opened up a touch
  // (were SP.xs/1.42) for easier reading now that the text column is
  // narrower (image grew — see dayImg below).
  dayText: { fontSize: 10.5, color: "#555", marginTop: SP.xs + 1, lineHeight: 1.5 },
  // Enlarged from 128×90 (felt like a thumbnail) — objectFit "cover" still
  // guarantees no distortion regardless of the box's aspect ratio, it just
  // crops the same source image to fill more visual space.
  dayImg: {
    width: 218,
    height: 120,
    borderRadius: 8,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: C.border,
  },

  // Meta row — sits BELOW the title/desc/image row (full card width, not
  // constrained by the image column) so a long highlights list has real
  // horizontal room instead of stacking up vertically. Meals/Stay/Drop take
  // the left 40%, Highlights the right 60% (each defaults to 100% if the
  // other side is empty for a given day — see the width override in JSX).
  // marginTop/paddingTop widened (were SP.xs) — this is the description→
  // metadata hierarchy break, worth more separation than an internal gap.
  dayMetaRow: {
    flexDirection: "row",
    gap: SP.sm + 2,
    marginTop: SP.sm,
    paddingTop: SP.sm,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  dayMetaLeft: { width: "40%" },
  dayMetaLeftItem: { flexDirection: "row", gap: 6, marginBottom: SP.xs + 1 },
  metaLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metaValue: { fontSize: 9.5, color: C.ink, lineHeight: 1.4, marginTop: 1 },

  // Highlights — its own premium, scannable block on the right: chip icon +
  // label, then each highlight as a bulleted item, two per line (content
  // untouched — just the same comma-separated value split into short items
  // laid out in a 2-column wrap instead of one-per-line, so a longer
  // highlights list adds width usage before it adds height). Capped at 4
  // items in JSX (see the days.map below) — that cap frees up vertical
  // budget previously spent on 5+ item lists, spent here instead on more
  // generous container padding and inter-item spacing.
  dayMetaRight: {
    width: "60%",
    backgroundColor: C.lightGreen,
    borderRadius: 8,
    padding: SP.sm,
  },
  highlightsHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: SP.xs + 1 },
  highlightsLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  highlightsGrid: { flexDirection: "row", flexWrap: "wrap" },
  highlightItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: SP.xs,
    paddingRight: 6,
  },
  highlightDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.green, marginTop: 4 },
  highlightText: { flex: 1, fontSize: 9.5, color: C.ink, lineHeight: 1.35 },

  // Table
  table: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 6,
  },
  tHead: { flexDirection: "row", backgroundColor: C.lightGreen },
  th: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    padding: SP.sm,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border },
  td: { fontSize: 10.5, padding: SP.sm, paddingVertical: SP.sm + 2, color: C.ink, lineHeight: 1.45 },
  // Hotel Details gets the most width since it's the longest-running field
  // (full property name + notes) and is the one most prone to ugly wrapping.
  colDest: { width: "16%" },
  colHotel: { width: "34%" },
  colNights: { width: "8%" },
  colRoom: { width: "16%" },
  colRooms: { width: "12%" },
  colMeal: { width: "14%" },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: SP.sm },
  legendItem: { fontSize: 8.5, color: C.muted },
  note: { fontSize: 8.5, color: C.muted, fontStyle: "italic", marginTop: 6 },
  hotelImagesRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  hotelImg: { flex: 1, height: 90, borderRadius: 8, objectFit: "cover" },

  // Included Activities — one bordered row per activity (image left, name +
  // place/time on the right), same card language as everywhere else in the
  // document. Add/remove per itinerary via the editor; the whole section is
  // omitted when the list is empty (see JSX below), never rendered as an
  // empty heading.
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.md,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: SP.sm + 2,
    marginBottom: SP.sm + 2,
    backgroundColor: C.white,
  },
  // 40% of the card width (was a fixed 92×72 thumbnail) — image is now a
  // proper visual component of the row, not an icon-sized afterthought.
  // objectFit "cover" keeps it distortion-free regardless of the source
  // photo's own aspect ratio.
  activityImg: {
    width: "40%",
    height: 130,
    borderRadius: 8,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: C.border,
  },
  // flex: 1 fills whatever remains after the 40% image + gap — i.e. ~60%,
  // without risking a >100% overflow from hardcoding both sides as percents.
  activityBody: { flex: 1 },
  activityName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },
  activityMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: SP.md, marginTop: SP.xs + 1 },
  activityMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  activityMetaText: { fontSize: 9.5, color: C.muted },

  // 2-3 activities: a responsive column grid instead of the single stacked
  // row above (image on top, name + place/time below, per column) — 50/50
  // for 2, 33.3/33.3/33.3 for 3. A 4th+ activity wraps onto a new row of up
  // to 3 columns rather than shrinking columns further. Width is set inline
  // per activity count (JSX below); paddingHorizontal here + the grid's
  // negative marginHorizontal form the gutter between columns without
  // pushing the row past 100% width.
  activityGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -(SP.xs + 2) },
  activityTile: { paddingHorizontal: SP.xs + 2, marginBottom: SP.sm + 2 },
  activityTileCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: SP.sm,
    backgroundColor: C.white,
  },
  activityTileImg: {
    width: "100%",
    height: 110,
    borderRadius: 8,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: C.border,
  },
  activityTileName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginTop: SP.xs + 2,
  },

  // Trust strip — "Why travel with Vertex" framing: a heading ties the 4
  // cells together as one deliberate section instead of 4 unrelated boxes,
  // and (when real rating data is available) a compact review badge sits
  // alongside the heading as an additional, equally-real trust signal.
  trustSection: { marginTop: SP.md },
  trustHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SP.sm,
  },
  trustHead: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.green },
  reviewBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  reviewStars: { flexDirection: "row", gap: 1 },
  reviewText: { fontSize: 8.5, color: C.muted },
  reviewTextStrong: { fontFamily: "Helvetica-Bold", color: C.ink },
  trust: {
    flexDirection: "row",
    backgroundColor: C.cream,
    borderRadius: 12,
    paddingVertical: SP.md,
  },
  trustCell: { flex: 1, alignItems: "center", paddingHorizontal: 8, textAlign: "center" },
  trustTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "center", marginTop: 5 },
  trustSub: { fontSize: 8, color: C.muted, textAlign: "center", marginTop: 2, lineHeight: 1.3 },

  // Transport
  transportRow: { flexDirection: "row", gap: SP.lg, alignItems: "center", marginBottom: SP.lg },
  transportImg: { width: 200, height: 120, borderRadius: 8, objectFit: "cover" },
  transportType: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },
  transportDesc: { fontSize: 10.5, color: C.muted, marginTop: 2 },

  // Two columns (inc/exc, policies)
  twoCol: { flexDirection: "row", gap: SP.xxl },
  col: { flex: 1 },
  listHead: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.green, marginBottom: SP.sm },
  listRow: { flexDirection: "row", gap: SP.sm, marginBottom: SP.xs + 1 },
  bulletInc: { width: 9, fontSize: 10, color: C.green, fontFamily: "Helvetica-Bold" },
  bulletExc: { width: 9, fontSize: 10, color: C.rose, fontFamily: "Helvetica-Bold" },
  listText: { flex: 1, fontSize: 10.5, color: "#444", lineHeight: 1.32 },

  policyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: SP.sm + 2,
  },
  policyHead: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginBottom: SP.sm,
    letterSpacing: 0.2,
  },

  // Why Choose Vertex — new, compact trust section using only real
  // WhyChooseItem copy from the DB (see src/lib/itinerary/pdfTrustContent.ts).
  whyChoose: { marginTop: SP.md },
  whyChooseIntro: {
    fontSize: 10,
    color: "#555",
    lineHeight: 1.4,
    marginBottom: SP.sm + 2,
    fontStyle: "italic",
  },
  whyChooseGrid: { flexDirection: "row", flexWrap: "wrap", gap: SP.sm },
  whyChooseItem: {
    width: "47%",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: SP.sm,
  },
  whyChooseItemTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.ink },
  whyChooseItemDesc: { fontSize: 8.5, color: C.muted, marginTop: 2, lineHeight: 1.35 },

  // Closing page — mirrors the admin editor's on-screen preview exactly
  // (ItineraryEditor.tsx "Thank you" article): a full-width dark green
  // Payment Options block on top, then a two-column row below it — white
  // left column (logo + company + contact), dark green right column
  // (Thank You + tagline). TY_GREEN/TY_MINT are the editor's actual literal
  // hex values (hsl(158 46% 14%) / hsl(146 35% 55%)) — not the same as the
  // C.greenDark/C.mint used on the cover/footer elsewhere in this file,
  // which is why this page previously looked like a different, mismatched
  // green from the admin preview.
  // Original (approved) content positioning — unchanged from before the
  // full-bleed background was added. Applied to an inner content wrapper
  // (not the <Page> itself, see s.tyPageOuter) so every foreground element
  // keeps the exact padding/centering math it always had, independent of
  // the background layer below. Deliberately no backgroundColor: this
  // wrapper sits on top of the full-bleed green/navy rectangles, and an
  // opaque fill here would paint over and hide them.
  tyPage: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    justifyContent: "center",
  },
  // The actual <Page> style: zero padding so the background layer below can
  // reach the true physical page edges unambiguously (no dependency on how
  // absolute positioning resolves against a padded ancestor). All foreground
  // content still renders through the padded/centred s.tyPage wrapper above,
  // so nothing about its position changes.
  tyPageOuter: { backgroundColor: C.white, padding: 0 },
  // Full-bleed background layer, painted behind the (unmoved) foreground
  // content. An approximate 50/50 split is safe here: the actual green/navy
  // section colors come from payBlock/tyLeftCol/tyRightCol's own unchanged
  // backgrounds, which are opaque and sit on top of this layer at their
  // original position — this layer only needs to be green above the real
  // content and navy below it, which a 50/50 split comfortably satisfies
  // given the content block spans the vertical middle majority of the page.
  tyBleedGreen: { position: "absolute", top: 0, left: 0, width: "100%", height: "50%", backgroundColor: TY_GREEN },
  tyBleedNavy: { position: "absolute", bottom: 0, left: 0, width: "100%", height: "50%", backgroundColor: TY_NAVY },

  // Payment options
  payBlock: {
    width: "100%",
    backgroundColor: TY_GREEN,
    alignItems: "center",
    paddingVertical: 34,
    paddingHorizontal: 30,
  },
  payHeadWrap: { alignItems: "center", marginBottom: 20 },
  payKicker: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    color: TY_MINT,
    textAlign: "center",
  },
  payKickerLine: { width: 40, height: 1.5, backgroundColor: TY_MINT, marginTop: 8 },
  payRow: { flexDirection: "row", alignItems: "center", gap: 16, width: "100%" },
  payPartnerCol: { width: "54%", alignItems: "center", justifyContent: "center" },
  payPartnerColFull: { width: "100%" },
  // 80/135 — both >=30% larger than the previous 58/100, per the "increase
  // both by at least 30%" request.
  payPartnerImg: { width: "100%", height: 80, objectFit: "contain" },
  payQrCol: { width: "42%", alignItems: "center", justifyContent: "center" },
  payQrHint: {
    fontSize: 7.5,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  payQrCard: { backgroundColor: C.white, borderRadius: 12, padding: 14 },
  payQrImg: { width: 135, height: 135, objectFit: "contain" },
  payQrCaption: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.5,
  },

  // Two-column closing row — left column is the theme's navy (--primary:
  // hsl(214 68% 14%)), so its logo/text switch to the light-on-dark variants
  // (same white logo used on the cover page) instead of the dark-on-white
  // ones a white panel would need.
  tyRow: { flexDirection: "row", width: "100%" },
  tyLeftCol: { width: "62%", backgroundColor: TY_NAVY, paddingVertical: 30, paddingHorizontal: 28 },
  tyLeftLogo: { width: 150, height: 34, objectFit: "contain" },
  tyCompany: { fontSize: 14.5, fontFamily: "Helvetica-Bold", color: C.white, marginTop: 14 },
  tyReg: { fontSize: 8.5, color: "rgba(255,255,255,0.55)", marginTop: 3 },
  tyContactWrap: { marginTop: 18 },
  tyInfoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 9 },
  tyInfo: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.4,
  },
  // Same navy as tyLeftCol — no explicit border was ever drawn between the
  // two columns, so matching their background removes the seam entirely
  // instead of needing to hide a line.
  tyRightCol: {
    width: "38%",
    backgroundColor: TY_NAVY,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  tyScript: { fontSize: 26, fontFamily: "Helvetica-Bold", color: TY_MINT, textAlign: "center" },
  tyMsg: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 1.5,
  },
});

function Footer() {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <View style={s.footer} fixed>
      <View style={s.footerLeft}>
        <View style={s.footerDotMark} />
        <Text style={s.footerBrand}>Vertex Kashmir Holidays</Text>
      </View>
      <Text style={s.footerContact}>
        {CONTACT.phonePrimary}
        <Text style={s.footerDot}>{"   ·   "}</Text>
        {CONTACT.email}
      </Text>
      <Text
        style={s.footerPage}
        render={({ pageNumber, totalPages }) => `${pad(pageNumber)} / ${pad(totalPages)}`}
      />
    </View>
  );
}

// Icons whose path geometry is a single closed silhouette (verified by
// inspection — each ends its main sub-path with Z/z) — safe to render solid
// (fill, no stroke) for a "premium" look. Icons built from open/disconnected
// strokes (calendar, car, meals, support, users) would look broken if filled
// naively, so they stay outline-only everywhere.
const SOLID_CAPABLE_ICONS = new Set<string>([
  "star",
  "highlights",
  "map-pin",
  "drop",
  "home",
  "shield",
  "users",
  "clock",
]);

// Icons whose 2nd path segment is a detail drawn ON TOP of the solid body
// (a checkmark on `shield`, hour/minute hands on `clock`) — always a white
// stroke overlay, never filled (these are open strokes with no enclosed
// area).
const SOLID_OVERLAY_STROKE_ICONS = new Set<string>(["shield", "clock"]);

// react-pdf equivalent of ItineraryIcon (./icons.tsx) — same path registry, so
// the PDF's icons never drift from the live editor's. react-pdf has no <img>
// equivalent for inline vector icons, hence the separate Svg/Path render here
// rather than reusing the DOM <svg>-based ItineraryIcon component directly.
function PdfIcon({
  icon,
  size = 12,
  color = C.green,
  strokeWidth = 1.8,
  solid = false,
}: {
  icon: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Render as a filled silhouette instead of an outline — only applied for icons in SOLID_CAPABLE_ICONS, ignored otherwise. */
  solid?: boolean;
}) {
  const d = ITINERARY_ICON_PATHS[icon as ItineraryIconKey] ?? "M12 8v0 M12 12v0 M12 16v0";
  const useSolid = solid && SOLID_CAPABLE_ICONS.has(icon);
  const segments = d.split(" M").map((seg, i) => (i === 0 ? seg : `M${seg}`));
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {segments.map((seg, i) => {
        const isOverlayStroke = SOLID_OVERLAY_STROKE_ICONS.has(icon) && i === 1;
        if (useSolid && !isOverlayStroke) {
          return <Path key={i} d={seg} fill={color} stroke="none" />;
        }
        return (
          <Path
            key={i}
            d={seg}
            fill="none"
            stroke={isOverlayStroke ? C.white : color}
            strokeWidth={isOverlayStroke ? 2 : strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </Svg>
  );
}

// wrap={false} keeps the heading and its underline together; minPresenceAhead
// pulls the whole heading to the next page if too little room remains below,
// so a heading never strands at the bottom of a sheet with its content
// stranded on the next one. The value should roughly match the height of the
// smallest realistic atomic block that immediately follows the heading (the
// caller knows that; there's no single safe default — a value sized for a
// two-card policy block would push a heading followed only by a short table
// row further than it needs to go).
function SectionHead({ title, minPresenceAhead = 100 }: { title: string; minPresenceAhead?: number }) {
  return (
    <View style={s.secHeadRow} wrap={false} minPresenceAhead={minPresenceAhead}>
      <Text style={s.secHead}>{title}</Text>
      <View style={s.secLine} />
    </View>
  );
}

interface Props {
  data: ItineraryData;
  /** original src -> compressed JPEG data URL */
  images: Record<string, string>;
  /** Resolved Corporate Office (or Registered Office fallback) — falls back to the static PDF_CONTACT default if omitted. */
  address?: string;
  /**
   * Booking-token Razorpay Payment Link QR, already rendered to a data URL by
   * the caller (see src/lib/itinerary/export-pdf.tsx) — this is a live,
   * itinerary-specific payment link, never a static/bundled image. Omitted
   * (undefined) when no link could be resolved — the QR card is hidden
   * entirely in that case (existing "hidden rather than shown broken" rule
   * below), not filled with a generic fallback QR.
   */
  tokenQrDataUrl?: string;
  /** The fixed token amount that QR collects, in rupees — drives the "Pay ₹X only" caption. */
  tokenAmountRupees?: number;
  /**
   * Real review-rating badge, sourced server-side from the live site's own
   * HomeContent.aboutRatingTitle/Subtitle (see
   * src/lib/itinerary/pdfTrustContent.ts) — never invented here. Omitted
   * (null) simply isn't rendered. (Why Choose Vertex is separate — that's
   * editable itinerary content, see data.whyChoose.)
   */
  trustContent?: PdfTrustContent;
}

export function ItineraryPdf({
  data,
  images,
  address,
  tokenQrDataUrl,
  tokenAmountRupees,
  trustContent,
}: Props) {
  const img = (src: string) => images[src];
  const qrDataUrl = tokenQrDataUrl;
  const officeAddress = address ?? PDF_CONTACT.address;

  return (
    <Document title={`Itinerary - ${data.preparedFor}`} author="Vertex Kashmir Holidays">
      {/* COVER — full-bleed image with absolutely-positioned overlay content.
          The image + overlay are `fixed` (out of flow) so a page-tall image
          can't trigger a page break that would push the text onto a 2nd sheet. */}
      <Page size="A4" style={[s.page, s.cover]}>
        {img(data.coverImage) ? (
          <Image src={img(data.coverImage)} style={s.coverImg} fixed />
        ) : null}
        <View style={s.coverOverlay} fixed />

        <View style={s.coverBrand}>
          {img(LOGO_DARK_SRC) ? (
            <Image src={img(LOGO_DARK_SRC)} style={s.coverLogo} />
          ) : (
            <>
              {img(LOGO_SRC) ? (
                <View style={s.logoBox}>
                  <Image src={img(LOGO_SRC)} style={s.logoImg} />
                </View>
              ) : null}
              <Text style={s.brandName}>Vertex</Text>
              <Text style={s.brandSub}>KASHMIR HOLIDAYS</Text>
            </>
          )}
        </View>

        <View style={s.coverTitleBlock}>
          <Text style={s.coverTitle}>{data.coverTitle}</Text>
          <Text style={s.coverScript}>{data.subtitle}</Text>
          <View style={s.durationRow}>
            <View style={{ width: 30, height: 1, backgroundColor: "rgba(255,255,255,0.6)" }} />
            <Text style={s.durationText}>{data.duration}</Text>
          </View>
        </View>

        <View style={s.coverBottom}>
          <Text style={s.preparedLabel}>PREPARED FOR</Text>
          <Text style={s.preparedName}>{data.preparedFor}</Text>

          <View style={s.coverGrid}>
            <View style={s.coverGridCol}>
              <PdfIcon icon="calendar" size={14} color={C.white} />
              <Text style={s.coverGridValue}>{data.travelDates}</Text>
              <Text style={s.coverGridLabel}>TRAVEL DATES</Text>
            </View>
            <View style={s.coverGridCol}>
              <PdfIcon icon="users" size={14} color={C.white} solid />
              <Text style={s.coverGridValue}>{data.travelers}</Text>
              <Text style={s.coverGridLabel}>TRAVELLERS</Text>
            </View>
            <View style={s.coverGridCol}>
              <PdfIcon icon="star" size={14} color={C.white} solid />
              <Text style={s.coverGridValue}>{data.packageType}</Text>
              <Text style={s.coverGridLabel}>PACKAGE TYPE</Text>
            </View>
          </View>

          <View style={s.costBox}>
            <Text style={s.costValue}>{data.totalCost}</Text>
            <Text style={s.costLabel}>TOTAL PACKAGE COST</Text>
          </View>
        </View>
      </Page>

      {/* BODY — one continuous page so content flows and fills each sheet
          instead of leaving a near-empty page after every section. */}
      <Page size="A4" style={s.page}>
        {/* Faint icon watermark behind all content — fixed so it repeats on
            every physical sheet this flowing page spans. */}
        {img(LOGO_SRC) ? (
          <View style={s.watermark} fixed>
            <Image src={img(LOGO_SRC)} style={s.watermarkImg} />
          </View>
        ) : null}

        {/* Brand header, fixed to the top of every sheet. */}
        <View style={s.header} fixed>
          {img(LOGO_LIGHT_SRC) ? (
            <Image src={img(LOGO_LIGHT_SRC)} style={s.headerLogo} />
          ) : (
            <Text style={s.brandName}>Vertex</Text>
          )}
          <Text style={s.headerTag}>YOUR JOURNEY, CRAFTED</Text>
        </View>

        <View style={[s.centerHead, { alignItems: "center" }]}>
          <PdfIcon icon="map-pin" size={16} solid />
          <Text style={[s.destLabel, { marginTop: 4 }]}>Destinations</Text>
          <Text style={s.destValue}>{data.destinations}</Text>
        </View>

        <View style={s.infoBar}>
          {data.info.map((it) => (
            <View key={it.id} style={s.infoCell}>
              <PdfIcon icon={it.icon} size={14} solid />
              <Text style={s.infoValue}>{it.value}</Text>
              <Text style={s.infoLabel}>{it.label}</Text>
            </View>
          ))}
        </View>

        {/* 140: guarantees at least the DAY 01 card's badge + title + a
            couple of lines of description land with the heading. */}
        <SectionHead title="Daily Itinerary" minPresenceAhead={140} />
        {data.days.map((day, i) => {
          // Highlights get pulled out into their own premium scannable block
          // (see s.dayMetaRight) instead of sitting in the plain Meals/Stay/
          // Drop grid — content is untouched, just the same comma-separated
          // value split into short bulleted items instead of one sentence.
          //
          // Capped at MAX_HIGHLIGHTS (4): keeps the block scannable in a few
          // seconds instead of a long list, and lets a 2x2 layout stay
          // predictable. No item is reworded — this only ever *drops* items
          // beyond the 4th, keeping the first 4 in the CRM-authored order
          // (the order staff entered them in, the only ordering signal that
          // exists — there's no relevance/importance field to sort by).
          const highlightsMeta = day.meta.find((m) => m.label.trim().toLowerCase() === "highlights");
          const gridMeta = day.meta.filter((m) => m !== highlightsMeta);
          const highlightItems = highlightsMeta
            ? highlightsMeta.value
                .split(",")
                .map((h) => h.trim())
                .filter(Boolean)
                .slice(0, MAX_HIGHLIGHTS)
            : [];
          const hasMeta = gridMeta.length > 0;
          const hasHighlights = !!highlightsMeta && highlightItems.length > 0;
          return (
            <View key={day.id} style={s.dayCard} wrap={false}>
              <View style={s.day}>
                <View style={s.dayBadge}>
                  <Text style={s.dayBadgeKicker}>DAY</Text>
                  <Text style={s.dayBadgeNum}>{String(i + 1).padStart(2, "0")}</Text>
                </View>
                <View style={s.dayBody}>
                  <Text style={s.dayTitle}>{day.title}</Text>
                  <Text style={s.dayText}>{day.body}</Text>
                </View>
                {img(day.image) ? <Image src={img(day.image)} style={s.dayImg} /> : null}
              </View>
              {/* Full-width row below the title/desc/image — not confined to
                  the image column, so Highlights get the whole card's width
                  to work with (2 items per line) rather than fighting the
                  image for space. Meals/Stay/Drop default to 100% width when
                  a day has no Highlights, and vice versa. */}
              {hasMeta || hasHighlights ? (
                <View style={s.dayMetaRow}>
                  {hasMeta ? (
                    <View style={[s.dayMetaLeft, { width: hasHighlights ? "40%" : "100%" }]}>
                      {gridMeta.map((m) => (
                        <View key={m.id} style={s.dayMetaLeftItem}>
                          <View style={s.iconChip}>
                            <PdfIcon icon={m.label.trim().toLowerCase()} size={11} solid />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.metaLabel}>{m.label}</Text>
                            <Text style={s.metaValue}>{m.value}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {hasHighlights ? (
                    <View style={[s.dayMetaRight, { width: hasMeta ? "60%" : "100%" }]}>
                      <View style={s.highlightsHead}>
                        <PdfIcon icon="highlights" size={11} color={C.green} solid />
                        <Text style={s.highlightsLabel}>{highlightsMeta!.label}</Text>
                      </View>
                      <View style={s.highlightsGrid}>
                        {highlightItems.map((h, hi) => (
                          <View key={hi} style={s.highlightItem}>
                            <View style={s.highlightDot} />
                            <Text style={s.highlightText}>{h}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}

        {/* ACCOMMODATION — heading and table grouped into one wrap={false}
            block. minPresenceAhead alone isn't enough here: it only checks
            room for the heading itself, not for the table that follows, so
            a heading could still land alone at the bottom of a sheet with
            the whole table forced onto a near-empty next page. Grouping
            them means react-pdf decides on the *combined* height, so the
            pair either both fit or both move together. Safe for realistic
            hotel counts (well under a page tall even at 10+ days); react-pdf
            has no header-repeat for plain Views, so this also keeps the
            table from ever breaking mid-way and stranding rows without
            their column headers. */}
        <View style={s.sectionGap} wrap={false}>
          <SectionHead title="Accommodation Info" />
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.th, s.colDest]}>Destination</Text>
              <Text style={[s.th, s.colHotel]}>Hotel Details</Text>
              <Text style={[s.th, s.colNights]}>Nights</Text>
              <Text style={[s.th, s.colRoom]}>Room Type</Text>
              <Text style={[s.th, s.colRooms]}>No. of Rooms</Text>
              <Text style={[s.th, s.colMeal]}>Meal Type</Text>
            </View>
            {data.hotels.map((h) => (
              <View key={h.id} style={s.tRow} wrap={false}>
                <Text style={[s.td, s.colDest, { fontFamily: "Helvetica-Bold" }]}>
                  {h.destination}
                </Text>
                <Text style={[s.td, s.colHotel, { color: C.muted }]}>{h.hotelDetails}</Text>
                <Text style={[s.td, s.colNights]}>{h.nights}</Text>
                <Text style={[s.td, s.colRoom]}>{h.roomType}</Text>
                <Text style={[s.td, s.colRooms]}>{h.rooms}</Text>
                <Text style={[s.td, s.colMeal]}>{h.mealType}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.legendRow} wrap={false}>
          {MEAL_PLAN_LEGEND.map((l) => (
            <Text key={l.code} style={s.legendItem}>
              <Text style={{ fontFamily: "Helvetica-Bold", color: C.ink }}>{l.code}</Text> →{" "}
              {l.meaning}
            </Text>
          ))}
        </View>
        <Text style={s.note}>
          *All accommodations are subject to availability at the time of confirmation.
        </Text>
        {data.hotelImages.some((src) => img(src)) ? (
          <View style={s.hotelImagesRow} wrap={false}>
            {data.hotelImages.map((src, i) =>
              img(src) ? <Image key={i} src={img(src)} style={s.hotelImg} /> : null,
            )}
          </View>
        ) : null}

        <View style={s.trustSection} wrap={false}>
          <View style={s.trustHeadRow}>
            <Text style={s.trustHead}>Why Travel With Vertex</Text>
            {/* Real rating/review-count only — see pdfTrustContent.ts. Never
                shown if that data isn't available (no invented numbers). */}
            {trustContent?.rating ? (
              <View style={s.reviewBadge}>
                <View style={s.reviewStars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <PdfIcon
                      key={n}
                      icon="star"
                      size={9}
                      color={
                        trustContent.rating!.value != null && n <= Math.round(trustContent.rating!.value)
                          ? C.green
                          : C.border
                      }
                      solid
                    />
                  ))}
                </View>
                <Text style={s.reviewText}>
                  <Text style={s.reviewTextStrong}>{trustContent.rating.title}</Text>
                  {"  ·  "}
                  {trustContent.rating.subtitle}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={s.trust}>
            {data.trust.map((t) => (
              <View key={t.id} style={s.trustCell}>
                <View style={s.iconChip}>
                  <PdfIcon icon={t.icon} size={13} solid />
                </View>
                <Text style={s.trustTitle}>{t.title}</Text>
                <Text style={s.trustSub}>{t.subtitle}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* INCLUDED ACTIVITIES — editable add/remove list (data.activities),
            omitted entirely when empty rather than shown as an empty
            heading. Grouped with its heading in one wrap={false} block like
            Accommodation above it: realistically a short list, so atomic
            grouping avoids an orphaned heading without meaningful overflow
            risk.
            Layout depends on count: exactly 1 activity keeps the wide
            horizontal card (image left 40%, content right 60%); 2+ switch to
            a column grid (image on top, name + place/time below), 50/50 for
            2, 33.3% each for 3, wrapping onto further rows beyond 3 rather
            than shrinking columns further. Editor stays a plain vertical
            list regardless of count — this responsive layout is PDF-only. */}
        {data.activities.length === 1 ? (
          <View style={s.sectionGap} wrap={false}>
            <SectionHead title="Included Activities" />
            {data.activities.map((a) => (
              <View key={a.id} style={s.activityCard} wrap={false}>
                {img(a.image) ? <Image src={img(a.image)} style={s.activityImg} /> : null}
                <View style={s.activityBody}>
                  <Text style={s.activityName}>{a.name}</Text>
                  <View style={s.activityMetaRow}>
                    <View style={s.activityMetaItem}>
                      <PdfIcon icon="map-pin" size={11} color={C.green} solid />
                      <Text style={s.activityMetaText}>{a.place}</Text>
                    </View>
                    <View style={s.activityMetaItem}>
                      <PdfIcon icon="clock" size={11} color={C.green} solid />
                      <Text style={s.activityMetaText}>{a.time}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : data.activities.length > 1 ? (
          <View style={s.sectionGap} wrap={false}>
            <SectionHead title="Included Activities" />
            <View style={s.activityGrid}>
              {data.activities.map((a) => (
                <View
                  key={a.id}
                  style={[s.activityTile, { width: `${100 / Math.min(data.activities.length, 3)}%` }]}
                  wrap={false}
                >
                  <View style={s.activityTileCard}>
                    {img(a.image) ? <Image src={img(a.image)} style={s.activityTileImg} /> : null}
                    <Text style={s.activityTileName}>{a.name}</Text>
                    <View style={s.activityMetaRow}>
                      <View style={s.activityMetaItem}>
                        <PdfIcon icon="map-pin" size={10} color={C.green} solid />
                        <Text style={s.activityMetaText}>{a.place}</Text>
                      </View>
                      <View style={s.activityMetaItem}>
                        <PdfIcon icon="clock" size={10} color={C.green} solid />
                        <Text style={s.activityMetaText}>{a.time}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* TRANSPORT + INCLUSIONS/EXCLUSIONS — heading grouped with the
            transport row for the same reason as Accommodation above: their
            combined height decides whether they both fit or both move. */}
        <View style={s.sectionGap} wrap={false}>
          <SectionHead title="Transportation Info" />
          <View style={s.transportRow}>
            <View style={{ flex: 1, flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <PdfIcon icon="car" size={20} />
              <View style={{ flex: 1 }}>
                <Text style={s.transportType}>{data.transportType}</Text>
                <Text style={s.transportDesc}>{data.transportDesc}</Text>
              </View>
            </View>
            {img(data.transportImage) ? (
              <Image src={img(data.transportImage)} style={s.transportImg} />
            ) : null}
          </View>
        </View>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.listHead}>Package Inclusions</Text>
            {data.inc.map((item, i) => (
              <View key={i} style={s.listRow} wrap={false}>
                <Text style={s.bulletInc}>+</Text>
                <Text style={s.listText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={s.col}>
            <Text style={s.listHead}>Package Exclusions</Text>
            {data.exc.map((item, i) => (
              <View key={i} style={s.listRow} wrap={false}>
                <Text style={s.bulletExc}>x</Text>
                <Text style={s.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* TERMS & POLICIES — heading grouped with both cards. This is the
            block most prone to the orphan pattern (two independently
            wrap={false} cards side by side), so grouping is what actually
            fixes it — a fixed minPresenceAhead number can't reliably predict
            two variable-length policy lists' combined height. */}
        <View style={s.sectionGap} wrap={false}>
          <SectionHead title="Terms & Policies" />
          <View style={s.twoCol}>
            <View style={s.policyCard}>
              <Text style={s.policyHead}>Payment Policy</Text>
              {data.pay.map((item, i) => (
                <View key={i} style={s.listRow} wrap={false}>
                  <Text style={s.bulletInc}>•</Text>
                  <Text style={s.listText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={s.policyCard}>
              <Text style={s.policyHead}>Cancellation Policy</Text>
              {data.cancel.map((item, i) => (
                <View key={i} style={s.listRow} wrap={false}>
                  <Text style={s.bulletExc}>•</Text>
                  <Text style={s.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* WHY CHOOSE VERTEX — editable itinerary content (data.whyChoose,
            same shape as data.trust), not server-fetched — see
            ItineraryEditor.tsx for where staff edit title/subtitle, and
            src/app/admin/itinerary/[id]/page.tsx for the one-time real-data
            seed on itineraries saved before this field existed. Section
            omitted entirely if the itinerary has no items. */}
        {data.whyChoose.length > 0 ? (
          // wrap={false}: this is the LAST section on the body page (nothing
          // follows but the footer), so if the heading landed alone at the
          // bottom of a sheet with the grid spilling to the next one, that
          // next sheet reads as almost entirely empty — worse than the small
          // amount of whitespace this atomic grouping might leave behind on
          // the sheet before it. Same fix as Terms & Policies above, same
          // reason. Content stays short (heading + intro + 4 short cards),
          // comfortably under a page tall.
          <View style={s.whyChoose} wrap={false}>
            <SectionHead title="Why Choose Vertex" />
            <Text style={s.whyChooseIntro}>
              From carefully planned itineraries to reliable local support, we handle the details so
              you can enjoy Kashmir with confidence.
            </Text>
            <View style={s.whyChooseGrid}>
              {data.whyChoose.map((w) => (
                <View key={w.id} style={s.whyChooseItem} wrap={false}>
                  <View style={s.iconChip}>
                    <PdfIcon icon={w.icon} size={11} solid />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.whyChooseItemTitle}>{w.title}</Text>
                    <Text style={s.whyChooseItemDesc}>{w.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Footer />
      </Page>

      {/* CLOSING PAGE — mirrors ItineraryEditor.tsx's "Thank you" preview
          article exactly: full-width Payment Options block on top, then a
          two-column row (white left = logo/company/contact, dark green
          right = Thank You + tagline). The <Page> itself has zero padding
          (s.tyPageOuter) so the two absolutely-positioned bleed rectangles
          below reach the true physical edges. All foreground content is
          unchanged and renders through the inner wrapper further down,
          which reapplies the exact original padding/centering (s.page +
          s.tyPage, same as before) — so nothing about its position, size,
          or alignment moves; only the background now extends edge-to-edge
          behind it. */}
      <Page size="A4" style={s.tyPageOuter}>
        <View style={s.tyBleedGreen} />
        <View style={s.tyBleedNavy} />
        <View style={[s.page, s.tyPage, { height: "100%" }]}>
        <View wrap={false}>
          <View style={s.payBlock}>
            <View style={s.payHeadWrap}>
              <Text style={s.payKicker}>PAYMENT OPTIONS</Text>
              <View style={s.payKickerLine} />
            </View>
            <View style={s.payRow}>
              <View style={qrDataUrl ? s.payPartnerCol : [s.payPartnerCol, s.payPartnerColFull]}>
                {img(PAYMENT_PARTNER_SRC) ? (
                  <Image src={img(PAYMENT_PARTNER_SRC)} style={s.payPartnerImg} />
                ) : null}
              </View>
              {/* QR card hidden entirely (rather than shown broken/generic) if
                  no token Payment Link could be resolved for this itinerary —
                  see resolveTokenPaymentLink. Never falls back to a static or
                  shared QR image. */}
              {qrDataUrl ? (
                <View style={s.payQrCol}>
                  <Text style={s.payQrHint}>Open your phone camera or Google Lens to scan</Text>
                  <View style={s.payQrCard}>
                    <Image src={qrDataUrl} style={s.payQrImg} />
                  </View>
                  <Text style={s.payQrCaption}>
                    {/* "Rs." not the ₹ glyph — react-pdf's standard Helvetica
                        font has no Rupee-sign glyph and silently mangles it
                        (renders as "¹"). Same convention as every other PDF
                        in this codebase — see src/lib/pdf/contact.ts inr(). */}
                    {tokenAmountRupees != null
                      ? `Pay ${inr(tokenAmountRupees)}/- only & confirm your booking`
                      : "Scan to pay"}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={s.tyRow}>
            <View style={s.tyLeftCol}>
              {img(LOGO_DARK_SRC) ? (
                <Image src={img(LOGO_DARK_SRC)} style={s.tyLeftLogo} />
              ) : (
                <Text style={s.brandName}>Vertex</Text>
              )}
              <Text style={s.tyCompany}>{CONTACT.company}</Text>
              <Text style={s.tyReg}>{CONTACT.reg}</Text>
              <View style={s.tyContactWrap}>
                <View style={s.tyInfoRow}>
                  <PdfIcon icon="support" size={11} color={TY_MINT} />
                  <Text style={s.tyInfo}>{CONTACT.phone}</Text>
                </View>
                <View style={s.tyInfoRow}>
                  <PdfIcon icon="map-pin" size={11} color={TY_MINT} />
                  <Text style={s.tyInfo}>{officeAddress}</Text>
                </View>
                <View style={s.tyInfoRow}>
                  <PdfIcon icon="calendar" size={11} color={TY_MINT} />
                  <Text style={s.tyInfo}>{CONTACT.email}</Text>
                </View>
              </View>
            </View>
            <View style={s.tyRightCol}>
              <Text style={s.tyScript}>Thank You!</Text>
              <Text style={s.tyMsg}>We look forward to hosting you in the paradise on earth.</Text>
            </View>
          </View>
        </View>
        </View>
      </Page>
    </Document>
  );
}
