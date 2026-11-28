/* eslint-disable jsx-a11y/alt-text */
// Guest welcome card (react-pdf) — the A4 landscape name board the driver
// holds up at arrival. Print-first: white paper, solid brand inks (navy +
// green from the Vertex logo), no tints or full-bleed fills, so it prints
// crisp on any office printer, colour or black & white.
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const NAVY = "#0e1f3d";
const BLUE = "#0b4ea2";
const GREEN = "#0a8a4b";
const MUTED = "#4b5563";

const s = StyleSheet.create({
  page: { backgroundColor: "#ffffff", fontFamily: "Helvetica", color: NAVY, padding: 22 },
  frame: { flex: 1, borderWidth: 2.5, borderColor: NAVY, padding: 5 },
  inner: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: 36,
  },
  logo: { width: 150, height: 113 },
  middle: { alignItems: "center", width: "100%" },
  welcome: { fontFamily: "Times-Italic", fontSize: 32, color: GREEN, letterSpacing: 0.5 },
  name: { fontFamily: "Helvetica-Bold", color: NAVY, textAlign: "center", lineHeight: 1.1 },
  names: { alignItems: "center", marginTop: 10 },
  family: { fontFamily: "Times-Italic", fontSize: 30, color: GREEN, marginTop: 4 },
  ruleRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  rule: { width: 70, borderBottomWidth: 1.2, borderBottomColor: BLUE },
  date: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    letterSpacing: 2,
    color: BLUE,
    marginHorizontal: 12,
  },
  footer: { alignItems: "center" },
  footerLine: { fontSize: 10, color: MUTED, letterSpacing: 0.4 },
});

/** As big as fits on one line across the card (Helvetica-Bold averages about
 *  0.53em per character), so the driver's sign reads from a distance; very
 *  long names step down to a floor and wrap. */
function nameSize(name: string): number {
  const fit = 690 / (Math.max(name.length, 1) * 0.53);
  return Math.round(Math.min(100, Math.max(34, fit)));
}

export interface WelcomeCardData {
  /** The lead guest, with their title — e.g. "Mr Nilesh Patel". */
  name: string;
  /** More than two travellers — "& Family" under the name. */
  family: boolean;
  /** e.g. "07 December 2026" */
  arrivalDate: string;
  phone: string;
  website: string;
}

export function WelcomeCardPdf({ data, logo }: { data: WelcomeCardData; logo: string | null }) {
  return (
    <Document title={`Welcome card — ${data.name}`} author="Vertex Kashmir Holidays">
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.frame}>
          <View style={s.inner}>
            {logo ? <Image src={logo} style={s.logo} /> : <View style={{ height: 113 }} />}
            <View style={s.middle}>
              <Text style={s.welcome}>Welcome to Kashmir</Text>
              <View style={s.names}>
                <Text style={[s.name, { fontSize: nameSize(data.name) }]}>{data.name}</Text>
                {data.family && <Text style={s.family}>& Family</Text>}
              </View>
              <View style={s.ruleRow}>
                <View style={s.rule} />
                <Text style={s.date}>{data.arrivalDate.toUpperCase()}</Text>
                <View style={s.rule} />
              </View>
            </View>
            <View style={s.footer}>
              <Text style={s.footerLine}>
                {data.phone}  ·  {data.website}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
