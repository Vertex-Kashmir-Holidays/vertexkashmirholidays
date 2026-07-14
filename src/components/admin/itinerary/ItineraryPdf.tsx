/* eslint-disable jsx-a11y/alt-text */
// PDF rendering of the itinerary using @react-pdf/renderer primitives.
// One <Page> per section; long sections wrap across physical pages.
// Text is vector (selectable); images are pre-compressed JPEG data URLs passed
// in via `images` (keyed by the original src) so the document stays under 1 MB.

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ItineraryData } from "@/types/itinerary";
import { PDF_CONTACT } from "@/lib/pdf/contact";
import { getPaymentQr } from "@/lib/itinerary/payment";

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
  page: { paddingTop: 58, paddingBottom: 40, paddingHorizontal: 40, fontSize: 10, color: C.ink, fontFamily: "Helvetica" },

  // Fixed brand header repeated on every physical sheet of the body page.
  header: { position: "absolute", top: 20, left: 40, right: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 8 },
  headerLogo: { width: 120, height: 30, objectFit: "contain" },
  headerTag: { fontSize: 7.5, color: C.muted, letterSpacing: 1 },

  // Faint centred icon watermark — sits behind body content on every sheet.
  watermark: { position: "absolute", top: 250, left: 116, width: 360, height: 360, opacity: 0.045 },
  watermarkImg: { width: 360, height: 360, objectFit: "contain" },

  footer: { position: "absolute", bottom: 14, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1.5, borderTopColor: C.green, paddingTop: 7 },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 5, width: "30%" },
  footerDotMark: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.mint },
  footerBrand: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.green, letterSpacing: 0.4 },
  footerContact: { flex: 1, textAlign: "center", fontSize: 7, color: C.muted },
  footerDot: { color: C.mint, fontFamily: "Helvetica-Bold" },
  footerPage: { width: "30%", textAlign: "right", fontSize: 7.5, color: C.green, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },

  // Cover — every block is absolutely positioned over the full-bleed image so
  // the cover has zero in-flow height and can never overflow onto a 2nd page.
  cover: { padding: 0 },
  coverImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" },
  coverOverlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(12,28,22,0.58)" },
  coverBrand: { position: "absolute", top: 44, left: 44, right: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  coverTitleBlock: { position: "absolute", top: 210, left: 44, right: 44 },
  coverBottom: { position: "absolute", bottom: 44, left: 44, right: 44 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: { width: 34, height: 34, borderRadius: 6, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
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
  preparedLabel: { fontSize: 9, letterSpacing: 4, textAlign: "center", color: "rgba(255,255,255,0.7)" },
  preparedName: { fontSize: 28, fontFamily: "Helvetica-Bold", textAlign: "center", color: C.white, marginTop: 4 },
  coverGrid: { flexDirection: "row", marginTop: 22, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.25)", paddingTop: 16 },
  coverGridCol: { flex: 1, paddingRight: 10, alignItems: "center" },
  coverGridValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.white, textAlign: "center" },
  coverGridLabel: { fontSize: 8, letterSpacing: 1, color: "rgba(255,255,255,0.65)", marginTop: 3, textAlign: "center" },
  costBox: { marginTop: 18, backgroundColor: "rgba(16,38,27,0.88)", borderRadius: 10, paddingVertical: 16, paddingHorizontal: 12, alignItems: "center" },
  costValue: { fontSize: 24, fontFamily: "Helvetica-Bold", color: C.white, textAlign: "center" },
  costLabel: { fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.7)", marginTop: 4, textAlign: "center" },

  // Section headings
  section: { marginBottom: 8 },
  sectionGap: { marginTop: 26 },
  secHeadRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  secHead: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.green },
  secLine: { flex: 1, height: 1, backgroundColor: C.border },

  centerHead: { textAlign: "center", marginBottom: 8 },
  destLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.muted, textAlign: "center" },
  destValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.green, textAlign: "center", marginTop: 2 },

  // Info bar
  infoBar: { flexDirection: "row", borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 14, marginTop: 14, marginBottom: 22 },
  infoCell: { flex: 1, alignItems: "center", paddingHorizontal: 8, textAlign: "center" },
  infoValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "center", marginTop: 4 },
  infoLabel: { fontSize: 7.5, color: C.muted, textAlign: "center", marginTop: 2 },

  // Day
  day: { flexDirection: "row", gap: 12, marginBottom: 16 },
  dayBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.green, alignItems: "center", justifyContent: "center" },
  dayBadgeKicker: { fontSize: 6, color: C.white, fontFamily: "Helvetica-Bold" },
  dayBadgeNum: { fontSize: 13, color: C.white, fontFamily: "Helvetica-Bold" },
  dayBody: { flex: 1 },
  dayTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },
  dayText: { fontSize: 9.5, color: "#555", marginTop: 3, lineHeight: 1.45 },
  metaWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  metaItem: { width: "33%", marginBottom: 4, paddingRight: 6 },
  metaLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.green },
  metaValue: { fontSize: 8, color: C.muted, lineHeight: 1.4 },
  dayImg: { width: 120, height: 80, borderRadius: 8, objectFit: "cover" },

  // Table
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: "hidden", marginTop: 6 },
  tHead: { flexDirection: "row", backgroundColor: C.lightGreen },
  th: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.green, padding: 7 },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border },
  td: { fontSize: 9, padding: 7, color: C.ink, lineHeight: 1.4 },
  colDest: { width: "26%" },
  colHotel: { width: "44%" },
  colNights: { width: "13%" },
  colRoom: { width: "17%" },
  note: { fontSize: 8, color: C.muted, fontStyle: "italic", marginTop: 6 },

  // Trust strip
  trust: { flexDirection: "row", backgroundColor: C.cream, borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  trustCell: { flex: 1, alignItems: "center", paddingHorizontal: 6, textAlign: "center" },
  trustTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "center" },
  trustSub: { fontSize: 7.5, color: C.muted, textAlign: "center", marginTop: 1 },

  // Transport
  transportRow: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 22 },
  transportImg: { width: 200, height: 120, borderRadius: 8, objectFit: "cover" },
  transportType: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },
  transportDesc: { fontSize: 9.5, color: C.muted, marginTop: 2 },

  // Two columns (inc/exc, policies)
  twoCol: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },
  listHead: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.green, marginBottom: 8 },
  listRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  bulletInc: { width: 8, fontSize: 9, color: C.green, fontFamily: "Helvetica-Bold" },
  bulletExc: { width: 8, fontSize: 9, color: C.rose, fontFamily: "Helvetica-Bold" },
  listText: { flex: 1, fontSize: 9.5, color: "#444", lineHeight: 1.4 },

  policyCard: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 },
  policyHead: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 8 },

  // Closing page — mirrors the admin editor's on-screen preview exactly
  // (ItineraryEditor.tsx "Thank you" article): a full-width dark green
  // Payment Options block on top, then a two-column row below it — white
  // left column (logo + company + contact), dark green right column
  // (Thank You + tagline). TY_GREEN/TY_MINT are the editor's actual literal
  // hex values (hsl(158 46% 14%) / hsl(146 35% 55%)) — not the same as the
  // C.greenDark/C.mint used on the cover/footer elsewhere in this file,
  // which is why this page previously looked like a different, mismatched
  // green from the admin preview.
  tyPage: { backgroundColor: C.white, paddingVertical: 60, paddingHorizontal: 40, justifyContent: "center" },

  // Payment options
  payBlock: { width: "100%", backgroundColor: TY_GREEN, alignItems: "center", paddingVertical: 34, paddingHorizontal: 30 },
  payHeadWrap: { alignItems: "center", marginBottom: 20 },
  payKicker: { fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 3, color: TY_MINT, textAlign: "center" },
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
  payQrCaption: { fontSize: 8.5, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 8, letterSpacing: 0.5 },

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
  tyInfo: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.9)", marginTop: 9, lineHeight: 1.4 },
  // Same navy as tyLeftCol — no explicit border was ever drawn between the
  // two columns, so matching their background removes the seam entirely
  // instead of needing to hide a line.
  tyRightCol: { width: "38%", backgroundColor: TY_NAVY, alignItems: "center", justifyContent: "center", paddingVertical: 30, paddingHorizontal: 20 },
  tyScript: { fontSize: 26, fontFamily: "Helvetica-Bold", color: TY_MINT, textAlign: "center" },
  tyMsg: { fontSize: 9.5, color: "rgba(255,255,255,0.82)", textAlign: "center", marginTop: 12, lineHeight: 1.5 },
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

function SectionHead({ title }: { title: string }) {
  // wrap={false} keeps the heading and its underline together; minPresenceAhead
  // pulls the whole heading to the next page if too little room remains below,
  // so a heading never strands at the bottom of a sheet.
  return (
    <View style={s.secHeadRow} wrap={false} minPresenceAhead={90}>
      <Text style={s.secHead}>{title}</Text>
      <View style={s.secLine} />
    </View>
  );
}

interface Props {
  data: ItineraryData;
  /** original src -> compressed JPEG data URL */
  images: Record<string, string>;
}

export function ItineraryPdf({ data, images }: Props) {
  const img = (src: string) => images[src];
  const qrDataUrl = img(getPaymentQr(data));

  return (
    <Document title={`Itinerary - ${data.preparedFor}`} author="Vertex Kashmir Holidays">
      {/* COVER — full-bleed image with absolutely-positioned overlay content.
          The image + overlay are `fixed` (out of flow) so a page-tall image
          can't trigger a page break that would push the text onto a 2nd sheet. */}
      <Page size="A4" style={[s.page, s.cover]}>
        {img(data.coverImage) ? <Image src={img(data.coverImage)} style={s.coverImg} fixed /> : null}
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
              <Text style={s.coverGridValue}>{data.travelDates}</Text>
              <Text style={s.coverGridLabel}>TRAVEL DATES</Text>
            </View>
            <View style={s.coverGridCol}>
              <Text style={s.coverGridValue}>{data.travelers}</Text>
              <Text style={s.coverGridLabel}>TRAVELLERS</Text>
            </View>
            <View style={s.coverGridCol}>
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

        <View style={s.centerHead}>
          <Text style={s.destLabel}>Destinations</Text>
          <Text style={s.destValue}>{data.destinations}</Text>
        </View>

        <View style={s.infoBar}>
          {data.info.map((it) => (
            <View key={it.id} style={s.infoCell}>
              <Text style={s.infoValue}>{it.value}</Text>
              <Text style={s.infoLabel}>{it.label}</Text>
            </View>
          ))}
        </View>

        <SectionHead title="Daily Itinerary" />
        {data.days.map((day, i) => (
          <View key={day.id} style={s.day} wrap={false}>
            <View style={s.dayBadge}>
              <Text style={s.dayBadgeKicker}>DAY</Text>
              <Text style={s.dayBadgeNum}>{String(i + 1).padStart(2, "0")}</Text>
            </View>
            <View style={s.dayBody}>
              <Text style={s.dayTitle}>{day.title}</Text>
              <Text style={s.dayText}>{day.body}</Text>
              <View style={s.metaWrap}>
                {day.meta.map((m) => (
                  <View key={m.id} style={s.metaItem}>
                    <Text style={s.metaLabel}>{m.label}</Text>
                    <Text style={s.metaValue}>{m.value}</Text>
                  </View>
                ))}
              </View>
            </View>
            {img(day.image) ? <Image src={img(day.image)} style={s.dayImg} /> : null}
          </View>
        ))}

        {/* ACCOMMODATION */}
        <View style={s.sectionGap}>
          <SectionHead title="Accommodation Info" />
        </View>
        <View style={s.table}>
          <View style={s.tHead} wrap={false}>
            <Text style={[s.th, s.colDest]}>Destination</Text>
            <Text style={[s.th, s.colHotel]}>Hotel Details</Text>
            <Text style={[s.th, s.colNights]}>Nights</Text>
            <Text style={[s.th, s.colRoom]}>Room Type</Text>
          </View>
          {data.hotels.map((h) => (
            <View key={h.id} style={s.tRow} wrap={false}>
              <Text style={[s.td, s.colDest, { fontFamily: "Helvetica-Bold" }]}>{h.destination}</Text>
              <Text style={[s.td, s.colHotel, { color: C.muted }]}>{h.hotelDetails}</Text>
              <Text style={[s.td, s.colNights]}>{h.nights}</Text>
              <Text style={[s.td, s.colRoom]}>{h.roomType}</Text>
            </View>
          ))}
        </View>
        <Text style={s.note}>*All accommodations are subject to availability at the time of confirmation.</Text>

        <View style={s.trust} wrap={false}>
          {data.trust.map((t) => (
            <View key={t.id} style={s.trustCell}>
              <Text style={s.trustTitle}>{t.title}</Text>
              <Text style={s.trustSub}>{t.subtitle}</Text>
            </View>
          ))}
        </View>

        {/* TRANSPORT + INCLUSIONS/EXCLUSIONS */}
        <View style={s.sectionGap}>
          <SectionHead title="Transportation Info" />
        </View>
        <View style={s.transportRow} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={s.transportType}>{data.transportType}</Text>
            <Text style={s.transportDesc}>{data.transportDesc}</Text>
          </View>
          {img(data.transportImage) ? <Image src={img(data.transportImage)} style={s.transportImg} /> : null}
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

        {/* TERMS & POLICIES */}
        <View style={s.sectionGap}>
          <SectionHead title="Terms & Policies" />
        </View>
        <View style={s.twoCol}>
          <View style={s.policyCard} wrap={false}>
            <Text style={s.policyHead}>Payment Policy</Text>
            {data.pay.map((item, i) => (
              <View key={i} style={s.listRow} wrap={false}>
                <Text style={s.bulletInc}>•</Text>
                <Text style={s.listText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={s.policyCard} wrap={false}>
            <Text style={s.policyHead}>Cancellation Policy</Text>
            {data.cancel.map((item, i) => (
              <View key={i} style={s.listRow} wrap={false}>
                <Text style={s.bulletExc}>•</Text>
                <Text style={s.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer />
      </Page>

      {/* CLOSING PAGE — mirrors ItineraryEditor.tsx's "Thank you" preview
          article exactly: full-width Payment Options block on top, then a
          two-column row (white left = logo/company/contact, dark green
          right = Thank You + tagline), both centred vertically on the page
          with generous top/bottom margin (tyPage.paddingVertical). */}
      <Page size="A4" style={[s.page, s.tyPage]}>
        <View wrap={false}>
          <View style={s.payBlock}>
            <View style={s.payHeadWrap}>
              <Text style={s.payKicker}>PAYMENT OPTIONS</Text>
              <View style={s.payKickerLine} />
            </View>
            <View style={s.payRow}>
              <View style={qrDataUrl ? s.payPartnerCol : [s.payPartnerCol, s.payPartnerColFull]}>
                {img(PAYMENT_PARTNER_SRC) ? <Image src={img(PAYMENT_PARTNER_SRC)} style={s.payPartnerImg} /> : null}
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
                <Text style={s.tyInfo}>{CONTACT.phone}</Text>
                <Text style={s.tyInfo}>{CONTACT.address}</Text>
                <Text style={s.tyInfo}>{CONTACT.email}</Text>
              </View>
            </View>
            <View style={s.tyRightCol}>
              <Text style={s.tyScript}>Thank You!</Text>
              <Text style={s.tyMsg}>We look forward to hosting you in the paradise on earth.</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
