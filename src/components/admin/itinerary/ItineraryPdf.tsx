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

const s = StyleSheet.create({
  page: { paddingVertical: 36, paddingHorizontal: 40, fontSize: 10, color: C.ink, fontFamily: "Helvetica", lineHeight: 1.45 },
  footer: { position: "absolute", bottom: 18, left: 40, right: 40, textAlign: "center", fontSize: 7, color: C.muted, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },

  // Cover
  cover: { padding: 0 },
  coverImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" },
  coverOverlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(12,28,22,0.55)" },
  coverInner: { padding: 44, height: "100%", display: "flex", flexDirection: "column", color: C.white },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white },
  brandSub: { fontSize: 8, letterSpacing: 2, color: "rgba(255,255,255,0.85)" },
  coverTitle: { fontSize: 64, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 2 },
  coverScript: { fontSize: 40, color: C.mint, marginTop: -6 },
  durationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  durationText: { fontSize: 11, letterSpacing: 3, color: C.white, fontFamily: "Helvetica-Bold" },
  preparedLabel: { fontSize: 9, letterSpacing: 4, textAlign: "center", color: "rgba(255,255,255,0.7)" },
  preparedName: { fontSize: 28, fontFamily: "Helvetica-Bold", textAlign: "center", color: C.white, marginTop: 4 },
  coverGrid: { flexDirection: "row", marginTop: 24, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.25)", paddingTop: 16 },
  coverGridCol: { flex: 1, paddingRight: 10 },
  coverGridValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.white },
  coverGridLabel: { fontSize: 8, letterSpacing: 1, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  costBox: { marginTop: 20, backgroundColor: "rgba(16,38,27,0.85)", borderRadius: 10, paddingVertical: 16, textAlign: "center" },
  costValue: { fontSize: 24, fontFamily: "Helvetica-Bold", color: C.white },
  costLabel: { fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  // Section headings
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
  dayText: { fontSize: 9.5, color: "#555", marginTop: 3 },
  metaWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  metaItem: { width: "33%", marginBottom: 4, paddingRight: 6 },
  metaLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.green },
  metaValue: { fontSize: 8, color: C.muted },
  dayImg: { width: 120, height: 80, borderRadius: 8, objectFit: "cover" },

  // Table
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: "hidden", marginTop: 6 },
  tHead: { flexDirection: "row", backgroundColor: C.lightGreen },
  th: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.green, padding: 7 },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border },
  td: { fontSize: 9, padding: 7, color: C.ink },
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
  listText: { flex: 1, fontSize: 9.5, color: "#444" },

  policyCard: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 },
  policyHead: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 8 },

  // Thank you
  tyWrap: { flexDirection: "row", height: "100%" },
  tyLeft: { flex: 1.5, padding: 36 },
  tyRight: { flex: 1, backgroundColor: C.greenDark, padding: 30, alignItems: "center", justifyContent: "center" },
  tyScript: { fontSize: 36, color: C.mint },
  tyMsg: { fontSize: 11, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 12 },
  tyContactRow: { marginTop: 8 },
  tyContact: { fontSize: 10, color: C.ink, marginBottom: 6 },
});

function Footer() {
  return <Text style={s.footer} fixed>Vertex Kashmir Holidays · Kashmir Escape Itinerary</Text>;
}

function SectionHead({ title }: { title: string }) {
  return (
    <View style={s.secHeadRow}>
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

  return (
    <Document title={`Itinerary - ${data.preparedFor}`} author="Vertex Kashmir Holidays">
      {/* COVER */}
      <Page size="A4" style={[s.page, s.cover]}>
        {img(data.coverImage) ? <Image src={img(data.coverImage)} style={s.coverImg} /> : null}
        <View style={s.coverOverlay} />
        <View style={s.coverInner}>
          <View style={s.brandRow}>
            <Text style={s.brandName}>Vertex</Text>
            <Text style={s.brandSub}>KASHMIR HOLIDAYS</Text>
          </View>

          <View style={{ marginTop: 70 }}>
            <Text style={s.coverTitle}>{data.coverTitle}</Text>
            <Text style={s.coverScript}>{data.subtitle}</Text>
            <View style={s.durationRow}>
              <View style={{ width: 30, height: 1, backgroundColor: "rgba(255,255,255,0.6)" }} />
              <Text style={s.durationText}>{data.duration}</Text>
            </View>
          </View>

          <View style={{ marginTop: "auto" }}>
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
        </View>
      </Page>

      {/* DESTINATIONS + DAILY ITINERARY */}
      <Page size="A4" style={s.page}>
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
        <Footer />
      </Page>

      {/* ACCOMMODATION */}
      <Page size="A4" style={s.page}>
        <SectionHead title="Accommodation Info" />
        <View style={s.table}>
          <View style={s.tHead}>
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

        <View style={s.trust}>
          {data.trust.map((t) => (
            <View key={t.id} style={s.trustCell}>
              <Text style={s.trustTitle}>{t.title}</Text>
              <Text style={s.trustSub}>{t.subtitle}</Text>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      {/* TRANSPORT + INCLUSIONS/EXCLUSIONS */}
      <Page size="A4" style={s.page}>
        <SectionHead title="Transportation Info" />
        <View style={s.transportRow}>
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
        <Footer />
      </Page>

      {/* TERMS & POLICIES */}
      <Page size="A4" style={s.page}>
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
        <Footer />
      </Page>

      {/* THANK YOU */}
      <Page size="A4" style={s.cover}>
        <View style={s.tyWrap}>
          <View style={s.tyLeft}>
            <View style={s.brandRow}>
              <Text style={[s.brandName, { color: C.ink }]}>Vertex</Text>
              <Text style={[s.brandSub, { color: C.green }]}>KASHMIR HOLIDAYS</Text>
            </View>
            <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: C.green, marginTop: 14 }}>
              Vertex Kashmir Tour & Travel
            </Text>
            <Text style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
              J&amp;K Tourism Registration number - JKTA0004560
            </Text>
            <View style={s.tyContactRow}>
              <Text style={[s.tyContact, { marginTop: 16 }]}>+91-7889577789 / +91-9682648388</Text>
              <Text style={s.tyContact}>Tangmarg, Gulmarg, India - 193402</Text>
              <Text style={s.tyContact}>support@vertexkashmirholidays.com</Text>
            </View>
          </View>
          <View style={s.tyRight}>
            <Text style={s.tyScript}>Thank You!</Text>
            <Text style={s.tyMsg}>We look forward to hosting you in the paradise on earth.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
