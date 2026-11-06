/* eslint-disable jsx-a11y/alt-text */
// Server-rendered PDF documents for booking summaries and payment invoices.
// Rendered to a Buffer via @react-pdf/renderer's renderToBuffer and attached to
// transactional emails. Text is vector; the only image is the brand logo (data
// URL). Note: the built-in Helvetica font has no rupee glyph, so money is
// formatted as "Rs." (see assets.inr) — never the ₹ symbol here.

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS as C, PDF_CONTACT as CONTACT, inr } from "./assets";
import { receiptGstLine } from "@/lib/payments/gst";
import {
  groupServiceTables,
  SHOW_SUMMARY_NOTE,
  GST_INCLUDED_NOTE,
  type DisplayService,
} from "@/lib/bookings/serviceDisplay";

export type PdfService = DisplayService;

export interface BookingSummaryPdfData {
  bookingRef: string;
  guestName: string;
  travelDate: string;
  travellers: number;
  services: PdfService[];
  inclusions: string[];
  bookingAmount: number;
  discountAmount: number;
  effectivePayable: number;
  paidAmount: number;
  balance: number;
  statusLabel: string;
}

export interface PaymentInvoicePdfData {
  invoiceRef: string;
  bookingRef: string;
  customerName: string;
  amount: number;
  type: string;
  method?: string | null;
  paymentDate: string;
  effectivePayable: number;
  totalPaid: number;
  balance: number;
  statusLabel: string;
  /** As recorded on this payment — null/absent when it carried no GST. */
  gstPercent?: number | null;
  gstAmount?: number | null;
}

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    // Clears the fixed footer (bottom: 26 + ~4 lines) so long content flows
    // to the next page instead of printing underneath it.
    paddingBottom: 84,
    paddingHorizontal: 44,
    fontSize: 10,
    color: C.ink,
    fontFamily: "Helvetica",
  },

  // Header band
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: C.green,
    paddingBottom: 14,
    marginBottom: 18,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 7,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: 30, height: 30, objectFit: "contain" },
  brandName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.green },
  brandSub: { fontSize: 7, letterSpacing: 2, color: C.muted, marginTop: 2 },
  docMeta: { alignItems: "flex-end" },
  docTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.ink, letterSpacing: 1 },
  docRef: { fontSize: 9, color: C.muted, marginTop: 4 },


  // Footer
  footer: {
    position: "absolute",
    bottom: 26,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    alignItems: "center",
  },
  // Optional brand icon pinned to both footer corners, vertically centred.
  footerCorner: { position: "absolute", top: 12, width: 24, height: 24, objectFit: "contain" },
  footerCompany: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.green },
  footerLine: { fontSize: 7.5, color: C.muted, marginTop: 2, textAlign: "center" },
  poweredBy: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  poweredByIcon: { width: 9, height: 9 },
  poweredByText: { fontSize: 6.5, color: C.muted },
});

// Exported so other document families (e.g. the salary slip) can reuse the
// same header/footer/meta-cell shell instead of redefining it.
export { s as sharedPdfStyles };

// B2B agent branding — when present, Header/Footer render the agent's own
// identity instead of Vertex's, so a B2B booking's invoice/receipt reads as
// coming from the partner agency the guest actually booked through (same
// white-label treatment as B2bItineraryPdf.tsx). Every other caller (normal
// customer bookings, the salary slip) omits this and gets the Vertex-branded
// shell unchanged.
export interface InvoiceAgentBranding {
  agencyName: string | null;
  /** Already a data: URI — agents upload PNG logos as base64, stored as-is. */
  agencyLogoUrl: string | null;
  phone: string | null;
  email: string;
}

export function Header({
  logo,
  title,
  ref: docRef,
  agent,
}: {
  logo: string | null;
  title: string;
  ref: string;
  agent?: InvoiceAgentBranding | null;
}) {
  const brandLogo = agent ? agent.agencyLogoUrl : logo;
  return (
    <View style={s.header}>
      <View style={s.brandRow}>
        {brandLogo ? (
          <View style={s.logoBox}>
            <Image src={brandLogo} style={s.logoImg} />
          </View>
        ) : null}
        <View>
          {agent ? (
            <Text style={s.brandName}>{agent.agencyName ?? "Travel Partner"}</Text>
          ) : (
            <>
              <Text style={s.brandName}>Vertex Kashmir</Text>
              <Text style={s.brandSub}>HOLIDAYS</Text>
            </>
          )}
        </View>
      </View>
      <View style={s.docMeta}>
        <Text style={s.docTitle}>{title}</Text>
        <Text style={s.docRef}>{docRef}</Text>
      </View>
    </View>
  );
}

export function Footer({
  address,
  gstNumber,
  agent,
  whiteLabel = true,
  vertexIcon,
  cornerIcon,
}: {
  address: string;
  /** SiteSettings.gstNumber — the same GSTIN shown in the site footer. Omitted
   *  on internal documents (e.g. the salary slip) and when it isn't configured. */
  gstNumber?: string | null;
  agent?: InvoiceAgentBranding | null;
  /** Agent-branded documents only — false once the agency hasn't yet earned
   *  full white-label (see WHITE_LABEL_MIN_BOOKINGS), adding a small
   *  "Powered by Vertex Kashmir Holidays" credit below the agent's own
   *  details. Ignored when `agent` is absent (never shown on Vertex's own
   *  documents — there's nothing to credit there). */
  whiteLabel?: boolean;
  /** Vertex's small square icon mark, as a data: URI — only needed (and only
   *  fetched by the caller) when `whiteLabel` is false. */
  vertexIcon?: string | null;
  /** Icon shown in both footer corners (data: URI). Omitted → no corner icons. */
  cornerIcon?: string | null;
}) {
  const corners = cornerIcon ? (
    <>
      <Image src={cornerIcon} style={[s.footerCorner, { left: 0 }]} />
      <Image src={cornerIcon} style={[s.footerCorner, { right: 0 }]} />
    </>
  ) : null;
  if (agent) {
    return (
      <View style={s.footer} fixed>
        {corners}
        <Text style={s.footerCompany}>{agent.agencyName ?? "Travel Partner"}</Text>
        <Text style={s.footerLine}>{[agent.phone, agent.email].filter(Boolean).join(" · ")}</Text>
        {!whiteLabel && (
          <View style={s.poweredBy}>
            {vertexIcon ? <Image src={vertexIcon} style={s.poweredByIcon} /> : null}
            <Text style={s.poweredByText}>Powered by Vertex Kashmir Holidays</Text>
          </View>
        )}
      </View>
    );
  }
  return (
    <View style={s.footer} fixed>
      {corners}
      <Text style={s.footerCompany}>{CONTACT.company}</Text>
      <Text style={s.footerLine}>
        {CONTACT.reg}
        {gstNumber ? ` · GSTIN: ${gstNumber}` : ""}
      </Text>
      <Text style={s.footerLine}>
        {CONTACT.phone} · {CONTACT.email}
      </Text>
      <Text style={s.footerLine}>{address}</Text>
    </View>
  );
}

// ── Booking summary ─────────────────────────────────────────────────────────
// The customer's "services invoice" — price-free service tables per kind and
// the overall price summary. Customers show it at hotels and to drivers, so it
// is laid out to read like a formal voucher and to fit on one A4 page.

// Relative column widths per service kind (same order as SERVICE_COLUMNS) —
// names get the room, short numeric columns (Rooms, Nights) stay narrow.
const COL_FLEX: Record<PdfService["kind"], number[]> = {
  HOTEL: [2.9, 1.2, 1.4, 0.7, 1.2, 1.2, 0.7],
  TRANSPORT: [2.2, 1.6, 1.6],
  ACTIVITY: [2.2, 1.2, 1.6],
  OTHER: [1],
};

const bs = StyleSheet.create({
  // Faint brand mark centred on every page, behind the content.
  watermark: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkImg: { width: 240, height: 240, opacity: 0.05 },
  watermarkText: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    opacity: 0.08,
    letterSpacing: 7,
    marginTop: 14,
  },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: C.green },

  infoCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.cream,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  infoCell: { paddingRight: 8 },
  infoLabel: { fontSize: 7, letterSpacing: 1, color: C.muted, textTransform: "uppercase" },
  infoValue: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 3 },
  statusChip: {
    alignSelf: "flex-start",
    marginTop: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    backgroundColor: C.green,
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 8,
  },

  notice: {
    flexDirection: "row",
    borderLeftWidth: 3,
    borderLeftColor: C.green,
    backgroundColor: C.lightGreen,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  noticeTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.green },
  noticeText: { fontSize: 8.5, color: C.greenDark, marginTop: 1.5, lineHeight: 1.35 },

  sectionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 2 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionRule: { flexGrow: 1, borderBottomWidth: 1, borderBottomColor: C.border, marginLeft: 8 },

  group: { marginBottom: 14 },
  tbl: { borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: "hidden" },
  tr: { flexDirection: "row" },
  trHead: { backgroundColor: C.green },
  trAlt: { backgroundColor: C.cream },
  th: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    paddingVertical: 5.5,
    paddingHorizontal: 7,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  td: { fontSize: 9, paddingVertical: 5.5, paddingHorizontal: 7, color: C.muted },
  tdFirst: { fontFamily: "Helvetica-Bold", color: C.ink },

  incWrap: { flexDirection: "row", flexWrap: "wrap" },
  incItem: { width: "50%", flexDirection: "row", marginBottom: 7, paddingRight: 8 },
  incDot: { fontSize: 9, color: C.green, fontFamily: "Helvetica-Bold", width: 9 },
  incText: { fontSize: 9, color: C.ink, flex: 1 },

  // Price summary and notes — each its own full-width card of divided rows.
  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 14,
  },
  cardHead: {
    backgroundColor: C.green,
    color: C.white,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    textTransform: "uppercase",
  },
  cardHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.green,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cardHeadTitle: {
    color: C.white,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardHeadNote: { color: C.mint, fontSize: 8, fontFamily: "Helvetica-Bold" },
  sumRow: { flexDirection: "row" },
  sumCell: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  sumCellTotal: { backgroundColor: C.lightGreen },
  sumLabel: { fontSize: 7.5, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase" },
  sumValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 4 },
  sumTotalLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sumTotalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.green, marginTop: 3 },
  noteRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  noteNum: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.green, width: 16 },
  noteText: { fontSize: 8.5, color: C.ink, flex: 1, lineHeight: 1.35 },
});

const SUMMARY_NOTES = [
  "Service inclusions are confirmed as above. Final accommodation and transport are subject to availability at the time of travel.",
  "Carry a valid government photo ID for every traveller — hotels ask for it at check-in.",
  "This is a computer-generated summary and does not require a signature.",
];

/** Faint brand mark behind every page's content — shared by every emailed/downloaded PDF. */
export function Watermark({ logo, agent }: { logo: string | null; agent?: InvoiceAgentBranding | null }) {
  // White-labelled B2B documents carry the agency's mark, never Vertex's.
  const mark = agent ? agent.agencyLogoUrl : logo;
  const label = agent ? (agent.agencyName ?? "") : "VERTEX KASHMIR HOLIDAYS";
  return (
    <View style={bs.watermark} fixed>
      {mark ? <Image src={mark} style={bs.watermarkImg} /> : null}
      {label ? <Text style={bs.watermarkText}>{label.toUpperCase()}</Text> : null}
    </View>
  );
}

/** Green card header with an optional right-aligned note (e.g. the GST line). */
function CardHead({ title, note }: { title: string; note?: string }) {
  return (
    <View style={bs.cardHeadRow}>
      <Text style={bs.cardHeadTitle}>{title}</Text>
      {note ? <Text style={bs.cardHeadNote}>{note}</Text> : null}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={bs.sectionRow}>
      <Text style={bs.sectionTitle}>{children}</Text>
      <View style={bs.sectionRule} />
    </View>
  );
}

export function BookingSummaryPdf({
  data,
  logo,
  address,
  gstNumber,
  agent,
  whiteLabel,
  vertexIcon,
}: {
  data: BookingSummaryPdfData;
  logo: string | null;
  /** Resolved Corporate Office (or Registered Office fallback) — see companyOffice.ts. */
  address: string;
  /** SiteSettings.gstNumber, rendered in the footer next to the tourism
   *  registration number. Null/absent when it isn't configured. */
  gstNumber?: string | null;
  /** B2B booking — white-labels this document to the agent instead of Vertex. */
  agent?: InvoiceAgentBranding | null;
  /** See Footer's own doc comment — ignored unless `agent` is set. */
  whiteLabel?: boolean;
  vertexIcon?: string | null;
}) {
  const grouped = groupServiceTables(data.services);
  const issued = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const priceRows = [
    { label: "Total (incl. GST)", value: inr(data.bookingAmount) },
    ...(data.discountAmount > 0
      ? [{ label: "Discount", value: `- ${inr(data.discountAmount)}` }]
      : []),
    { label: "Payable", value: inr(data.effectivePayable) },
    { label: "Paid", value: inr(data.paidAmount) },
  ];
  const info: { label: string; value: string; flex: number }[] = [
    { label: "Guest", value: data.guestName, flex: 2.2 },
    { label: "Booking Ref", value: data.bookingRef, flex: 1.3 },
    { label: "Travel Date", value: data.travelDate, flex: 1.3 },
    { label: "Travellers", value: String(data.travellers), flex: 0.9 },
  ];

  return (
    <Document
      title={`Booking Summary - ${data.bookingRef}`}
      author={agent?.agencyName ?? CONTACT.brand}
    >
      <Page size="A4" style={s.page}>
        <View style={bs.topBar} fixed />
        <Watermark logo={logo} agent={agent} />

        <Header
          logo={logo}
          title="BOOKING SUMMARY"
          ref={`Ref: ${data.bookingRef}  ·  Issued: ${issued}`}
          agent={agent}
        />

        <View style={bs.infoCard}>
          {info.map((f) => (
            <View key={f.label} style={[bs.infoCell, { flex: f.flex }]}>
              <Text style={bs.infoLabel}>{f.label}</Text>
              <Text style={bs.infoValue}>{f.value}</Text>
            </View>
          ))}
          <View style={[bs.infoCell, { flex: 1.3, paddingRight: 0 }]}>
            <Text style={bs.infoLabel}>Payment Status</Text>
            <Text style={bs.statusChip}>{data.statusLabel}</Text>
          </View>
        </View>

        <View style={bs.notice} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={bs.noticeTitle}>For hotels, drivers &amp; service providers</Text>
            <Text style={bs.noticeText}>{SHOW_SUMMARY_NOTE}</Text>
          </View>
        </View>

        {grouped.length === 0 ? (
          <Text style={[bs.noteText, { marginBottom: 14 }]}>Service details will be shared shortly.</Text>
        ) : (
          grouped.map((g) => {
            const flex = COL_FLEX[g.kind];
            return (
              <View key={g.kind} style={bs.group}>
                <SectionTitle>{g.title}</SectionTitle>
                <View style={bs.tbl}>
                  <View style={[bs.tr, bs.trHead]} wrap={false}>
                    {g.headers.map((h, i) => (
                      <Text key={i} style={[bs.th, { flexGrow: flex[i] ?? 1, flexBasis: 0 }]}>
                        {h}
                      </Text>
                    ))}
                  </View>
                  {g.rows.map((r, ri) => (
                    <View key={ri} style={ri % 2 === 1 ? [bs.tr, bs.trAlt] : bs.tr} wrap={false}>
                      {r.map((c, ci) => (
                        <Text
                          key={ci}
                          style={
                            ci === 0
                              ? [bs.td, bs.tdFirst, { flexGrow: flex[ci] ?? 1, flexBasis: 0 }]
                              : [bs.td, { flexGrow: flex[ci] ?? 1, flexBasis: 0 }]
                          }
                        >
                          {c}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}

        {data.inclusions.length > 0 && (
          <View style={bs.group}>
            <SectionTitle>Additional Inclusions</SectionTitle>
            <View style={bs.incWrap}>
              {data.inclusions.map((inc, i) => (
                <View key={i} style={bs.incItem} wrap={false}>
                  <Text style={bs.incDot}>•</Text>
                  <Text style={bs.incText}>{inc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Price summary — its own full-width card; each figure in its own
            divided cell, Balance Due highlighted at the end. */}
        <View style={bs.card} wrap={false}>
          <CardHead title="Price Summary" note={GST_INCLUDED_NOTE} />
          <View style={bs.sumRow}>
            {priceRows.map((r, i) => (
              <View key={r.label} style={i === 0 ? [bs.sumCell, { borderLeftWidth: 0 }] : bs.sumCell}>
                <Text style={bs.sumLabel}>{r.label}</Text>
                <Text style={bs.sumValue}>{r.value}</Text>
              </View>
            ))}
            <View style={[bs.sumCell, bs.sumCellTotal]}>
              <Text style={bs.sumTotalLabel}>Balance Due</Text>
              <Text style={bs.sumTotalValue}>{inr(data.balance)}</Text>
            </View>
          </View>
        </View>

        {/* Important notes — separate card below, one numbered row per note. */}
        <View style={bs.card} wrap={false}>
          <Text style={bs.cardHead}>Important Notes</Text>
          {SUMMARY_NOTES.map((note, i) => (
            <View key={i} style={bs.noteRow}>
              <Text style={bs.noteNum}>{i + 1}.</Text>
              <Text style={bs.noteText}>{note}</Text>
            </View>
          ))}
        </View>

        <Footer
          address={address}
          gstNumber={gstNumber}
          agent={agent}
          whiteLabel={whiteLabel}
          vertexIcon={vertexIcon}
          cornerIcon={agent ? agent.agencyLogoUrl : logo}
        />
      </Page>
    </Document>
  );
}

// Payment invoice — payment-specific financials only. No service line items.
export function PaymentInvoicePdf({
  data,
  logo,
  address,
  gstNumber,
  agent,
  whiteLabel,
  vertexIcon,
}: {
  data: PaymentInvoicePdfData;
  logo: string | null;
  /** Resolved Corporate Office (or Registered Office fallback) — see companyOffice.ts. */
  address: string;
  /** SiteSettings.gstNumber, rendered in the footer next to the tourism
   *  registration number. Null/absent when it isn't configured. */
  gstNumber?: string | null;
  /** B2B booking — white-labels this document to the agent instead of Vertex. */
  agent?: InvoiceAgentBranding | null;
  /** See Footer's own doc comment — ignored unless `agent` is set. */
  whiteLabel?: boolean;
  vertexIcon?: string | null;
}) {
  // A refund reuses this document; only the wording of the headline changes.
  const isRefund = data.type === "Refund";
  const gst = receiptGstLine(data.gstPercent, data.gstAmount);
  const receiptNotes = [
    `This receipt confirms the ${isRefund ? "refund" : "payment"} recorded above against booking ${data.bookingRef}.`,
    "For hotel, transport and activity details, please refer to your booking summary document.",
    "This is a computer-generated receipt and does not require a signature.",
  ];
  const details = [
    { label: "Receipt No.", value: data.invoiceRef },
    { label: "Payment Type", value: data.type },
    ...(data.method ? [{ label: "Payment Method", value: data.method }] : []),
    { label: "Payment Date", value: data.paymentDate },
    ...(gst ? [{ label: `${gst.label} (included)`, value: inr(gst.amount) }] : []),
  ];

  return (
    <Document
      title={`Payment Receipt - ${data.invoiceRef}`}
      author={agent?.agencyName ?? CONTACT.brand}
    >
      <Page size="A4" style={s.page}>
        <View style={bs.topBar} fixed />
        <Watermark logo={logo} agent={agent} />
        <Header
          logo={logo}
          title="PAYMENT RECEIPT"
          ref={`Receipt: ${data.invoiceRef}  ·  Date: ${data.paymentDate}`}
          agent={agent}
        />

        <View style={bs.infoCard}>
          <View style={[bs.infoCell, { flex: 2.2 }]}>
            <Text style={bs.infoLabel}>Received From</Text>
            <Text style={bs.infoValue}>{data.customerName}</Text>
          </View>
          <View style={[bs.infoCell, { flex: 1.3 }]}>
            <Text style={bs.infoLabel}>Booking Ref</Text>
            <Text style={bs.infoValue}>{data.bookingRef}</Text>
          </View>
          <View style={[bs.infoCell, { flex: 1.3 }]}>
            <Text style={bs.infoLabel}>Payment Date</Text>
            <Text style={bs.infoValue}>{data.paymentDate}</Text>
          </View>
          <View style={[bs.infoCell, { flex: 1.3, paddingRight: 0 }]}>
            <Text style={bs.infoLabel}>Booking Status</Text>
            <Text style={bs.statusChip}>{data.statusLabel}</Text>
          </View>
        </View>

        {/* Amount received — the one figure this document exists for. */}
        <View style={rs.hero} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={rs.heroLabel}>{isRefund ? "Amount Refunded" : "Amount Received"}</Text>
            <Text style={rs.heroValue}>{inr(data.amount)}</Text>
            <Text style={rs.heroWords}>
              {amountInWords(data.amount)}
              {gst ? ` · Inclusive of ${gst.label}` : ""}
            </Text>
          </View>
          <Text style={rs.heroStamp}>{isRefund ? "REFUNDED" : "RECEIVED"}</Text>
        </View>

        <View style={bs.card} wrap={false}>
          <Text style={bs.cardHead}>Payment Details</Text>
          {details.map((d) => (
            <View key={d.label} style={rs.kvRow}>
              <Text style={rs.kvLabel}>{d.label}</Text>
              <Text style={rs.kvValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        <View style={bs.card} wrap={false}>
          <CardHead title="Booking Balance" />
          <View style={bs.sumRow}>
            <View style={[bs.sumCell, { borderLeftWidth: 0 }]}>
              <Text style={bs.sumLabel}>Total Payable</Text>
              <Text style={bs.sumValue}>{inr(data.effectivePayable)}</Text>
            </View>
            <View style={bs.sumCell}>
              <Text style={bs.sumLabel}>Paid To Date</Text>
              <Text style={bs.sumValue}>{inr(data.totalPaid)}</Text>
            </View>
            <View style={[bs.sumCell, bs.sumCellTotal]}>
              <Text style={bs.sumTotalLabel}>Balance Due</Text>
              <Text style={bs.sumTotalValue}>{inr(data.balance)}</Text>
            </View>
          </View>
        </View>

        <View style={bs.card} wrap={false}>
          <Text style={bs.cardHead}>Important Notes</Text>
          {receiptNotes.map((note, i) => (
            <View key={i} style={bs.noteRow}>
              <Text style={bs.noteNum}>{i + 1}.</Text>
              <Text style={bs.noteText}>{note}</Text>
            </View>
          ))}
        </View>

        <Footer
          address={address}
          gstNumber={gstNumber}
          agent={agent}
          whiteLabel={whiteLabel}
          vertexIcon={vertexIcon}
          cornerIcon={agent ? agent.agencyLogoUrl : logo}
        />
      </Page>
    </Document>
  );
}

// Receipt-only styles (shares the booking summary's `bs` cards and info strip).
const rs = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.green,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  heroLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.mint,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroValue: { fontSize: 24, fontFamily: "Helvetica-Bold", color: C.white, marginTop: 4 },
  heroWords: { fontSize: 8.5, color: C.lightGreen, marginTop: 4 },
  heroStamp: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 2,
    borderWidth: 1.5,
    borderColor: C.mint,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  kvLabel: { fontSize: 9.5, color: C.muted },
  kvValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.ink },
});

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const rest = r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? ` ${ONES[r % 10]}` : ""}`;
  return [h ? `${ONES[h]} Hundred` : "", rest].filter(Boolean).join(" ");
}

/** Indian-system amount in words, e.g. 124300 → "Rupees One Lakh Twenty Four Thousand Three Hundred Only". */
export function amountInWords(amount: number): string {
  let n = Math.round(Math.abs(amount));
  if (n === 0) return "Rupees Zero Only";
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  n %= 100_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
  if (n) parts.push(belowThousand(n));
  return `Rupees ${parts.join(" ")} Only`;
}
