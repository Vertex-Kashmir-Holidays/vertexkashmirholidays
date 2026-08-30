/* eslint-disable jsx-a11y/alt-text */
// PDF rendering of the itinerary using @react-pdf/renderer primitives.
// One <Page> per section; long sections wrap across physical pages.
// Text is vector (selectable); images are pre-compressed JPEG data URLs passed
// in via `images` (keyed by the original src) so the document stays under 1 MB.

import { Document, Page, View, Text, Image, Svg, Path, StyleSheet } from "@react-pdf/renderer";
import type { ItineraryData } from "@/types/itinerary";
import { PDF_CONTACT } from "@/lib/pdf/contact";
import { getPaymentQr } from "@/lib/itinerary/payment";
import { MEAL_PLAN_LEGEND } from "@/lib/hotelSuppliers/schema";
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
  sectionGap: { marginTop: SP.xxxl },
  secHeadRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: SP.lg },
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
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    textAlign: "center",
    marginTop: 4,
  },
  infoLabel: { fontSize: 7.5, color: C.muted, textAlign: "center", marginTop: 2 },

  // Day — every day renders inside the same bordered card (consistent
  // padding/radius) so a short description and a long one produce the same
  // visual container instead of one day looking structurally different from
  // the next. wrap={false} on this card (applied in JSX) keeps badge, title,
  // description, metadata and image together as one atomic pagination unit.
  day: { flexDirection: "row", gap: SP.md },
  dayCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: SP.md,
    marginBottom: SP.md,
    backgroundColor: C.white,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeKicker: { fontSize: 6, color: C.white, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  dayBadgeNum: { fontSize: 13, color: C.white, fontFamily: "Helvetica-Bold" },
  dayBody: { flex: 1 },
  dayTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },
  dayText: { fontSize: 9.5, color: "#555", marginTop: SP.xs, lineHeight: 1.5 },
  metaWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: SP.sm,
    paddingTop: SP.sm,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  metaItem: { width: "33%", marginBottom: SP.xs, paddingRight: SP.sm },
  metaLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metaValue: { fontSize: 8.5, color: C.ink, lineHeight: 1.4, marginTop: 1 },
  dayImg: {
    width: 128,
    height: 90,
    borderRadius: 8,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: C.border,
  },

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
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    padding: SP.sm,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border },
  td: { fontSize: 9, padding: SP.sm, color: C.ink, lineHeight: 1.45 },
  // Hotel Details gets the most width since it's the longest-running field
  // (full property name + notes) and is the one most prone to ugly wrapping.
  colDest: { width: "16%" },
  colHotel: { width: "34%" },
  colNights: { width: "8%" },
  colRoom: { width: "16%" },
  colRooms: { width: "12%" },
  colMeal: { width: "14%" },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: SP.sm },
  legendItem: { fontSize: 8, color: C.muted },
  note: { fontSize: 8, color: C.muted, fontStyle: "italic", marginTop: 6 },
  hotelImagesRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  hotelImg: { flex: 1, height: 90, borderRadius: 8, objectFit: "cover" },

  // Trust strip
  trust: {
    flexDirection: "row",
    backgroundColor: C.cream,
    borderRadius: 12,
    paddingVertical: SP.md + 2,
    marginTop: SP.xl,
  },
  trustCell: { flex: 1, alignItems: "center", paddingHorizontal: 6, textAlign: "center" },
  trustTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "center" },
  trustSub: { fontSize: 7.5, color: C.muted, textAlign: "center", marginTop: 1 },

  // Transport
  transportRow: { flexDirection: "row", gap: SP.lg, alignItems: "center", marginBottom: SP.xl },
  transportImg: { width: 200, height: 120, borderRadius: 8, objectFit: "cover" },
  transportType: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },
  transportDesc: { fontSize: 9.5, color: C.muted, marginTop: 2 },

  // Two columns (inc/exc, policies)
  twoCol: { flexDirection: "row", gap: SP.xxl },
  col: { flex: 1 },
  listHead: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.green, marginBottom: SP.sm },
  listRow: { flexDirection: "row", gap: SP.sm, marginBottom: SP.xs + 2 },
  bulletInc: { width: 8, fontSize: 9, color: C.green, fontFamily: "Helvetica-Bold" },
  bulletExc: { width: 8, fontSize: 9, color: C.rose, fontFamily: "Helvetica-Bold" },
  listText: { flex: 1, fontSize: 9.5, color: "#444", lineHeight: 1.5 },

  policyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: SP.lg,
  },
  policyHead: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginBottom: SP.sm + 2,
    letterSpacing: 0.2,
  },

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

// react-pdf equivalent of ItineraryIcon (./icons.tsx) — same path registry, so
// the PDF's icons never drift from the live editor's. react-pdf has no <img>
// equivalent for inline vector icons, hence the separate Svg/Path render here
// rather than reusing the DOM <svg>-based ItineraryIcon component directly.
function PdfIcon({
  icon,
  size = 12,
  color = C.green,
  strokeWidth = 1.8,
}: {
  icon: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const d = ITINERARY_ICON_PATHS[icon as ItineraryIconKey] ?? "M12 8v0 M12 12v0 M12 16v0";
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {d.split(" M").map((seg, i) => (
        <Path
          key={i}
          d={i === 0 ? seg : `M${seg}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
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
}

export function ItineraryPdf({ data, images, address }: Props) {
  const img = (src: string) => images[src];
  const qrDataUrl = img(getPaymentQr(data));
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
              <PdfIcon icon="support" size={14} color={C.white} />
              <Text style={s.coverGridValue}>{data.travelers}</Text>
              <Text style={s.coverGridLabel}>TRAVELLERS</Text>
            </View>
            <View style={s.coverGridCol}>
              <PdfIcon icon="star" size={14} color={C.white} />
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
          <PdfIcon icon="map-pin" size={16} />
          <Text style={[s.destLabel, { marginTop: 4 }]}>Destinations</Text>
          <Text style={s.destValue}>{data.destinations}</Text>
        </View>

        <View style={s.infoBar}>
          {data.info.map((it) => (
            <View key={it.id} style={s.infoCell}>
              <PdfIcon icon={it.icon} size={13} />
              <Text style={s.infoValue}>{it.value}</Text>
              <Text style={s.infoLabel}>{it.label}</Text>
            </View>
          ))}
        </View>

        {/* 140: guarantees at least the DAY 01 card's badge + title + a
            couple of lines of description land with the heading. */}
        <SectionHead title="Daily Itinerary" minPresenceAhead={140} />
        {data.days.map((day, i) => (
          <View key={day.id} style={s.dayCard} wrap={false}>
            <View style={s.day}>
              <View style={s.dayBadge}>
                <Text style={s.dayBadgeKicker}>DAY</Text>
                <Text style={s.dayBadgeNum}>{String(i + 1).padStart(2, "0")}</Text>
              </View>
              <View style={s.dayBody}>
                <Text style={s.dayTitle}>{day.title}</Text>
                <Text style={s.dayText}>{day.body}</Text>
                <View style={s.metaWrap}>
                  {day.meta.map((m) => (
                    <View key={m.id} style={[s.metaItem, { flexDirection: "row", gap: 4 }]}>
                      <PdfIcon icon={m.label.trim().toLowerCase()} size={10} />
                      <View>
                        <Text style={s.metaLabel}>{m.label}</Text>
                        <Text style={s.metaValue}>{m.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              {img(day.image) ? <Image src={img(day.image)} style={s.dayImg} /> : null}
            </View>
          </View>
        ))}

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

        <View style={s.trust} wrap={false}>
          {data.trust.map((t) => (
            <View key={t.id} style={s.trustCell}>
              <PdfIcon icon={t.icon} size={14} />
              <Text style={[s.trustTitle, { marginTop: 4 }]}>{t.title}</Text>
              <Text style={s.trustSub}>{t.subtitle}</Text>
            </View>
          ))}
        </View>

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
              {/* QR card hidden entirely (rather than shown broken) if the
                  itinerary's custom QR — or the default — failed to load.
                  No advance-amount callout: the payment policy's advance %
                  only ever exists as free-text bullets (data.pay), never as
                  structured data, so there's nothing safe to compute from. */}
              {qrDataUrl ? (
                <View style={s.payQrCol}>
                  <View style={s.payQrCard}>
                    <Image src={qrDataUrl} style={s.payQrImg} />
                  </View>
                  <Text style={s.payQrCaption}>Scan to pay</Text>
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
