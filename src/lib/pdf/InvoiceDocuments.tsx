/* eslint-disable jsx-a11y/alt-text */
// Server-rendered PDF documents for booking summaries and payment invoices.
// Rendered to a Buffer via @react-pdf/renderer's renderToBuffer and attached to
// transactional emails. Text is vector; the only image is the brand logo (data
// URL). Note: the built-in Helvetica font has no rupee glyph, so money is
// formatted as "Rs." (see assets.inr) — never the ₹ symbol here.

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { PDF_COLORS as C, PDF_CONTACT as CONTACT, inr } from "./assets";

export interface PdfService {
  kind: "HOTEL" | "TRANSPORT" | "ACTIVITY" | "OTHER";
  name: string;
  location?: string | null;
  nights?: number | null;
  pickup?: string | null;
  dropoff?: string | null;
  timing?: string | null;
}

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
}

const s = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 44, fontSize: 10, color: C.ink, fontFamily: "Helvetica" },

  // Header band
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 2, borderBottomColor: C.green, paddingBottom: 14, marginBottom: 18 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  logoBox: { width: 38, height: 38, borderRadius: 7, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  logoImg: { width: 30, height: 30, objectFit: "contain" },
  brandName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.green },
  brandSub: { fontSize: 7, letterSpacing: 2, color: C.muted, marginTop: 2 },
  docMeta: { alignItems: "flex-end" },
  docTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.ink, letterSpacing: 1 },
  docRef: { fontSize: 9, color: C.muted, marginTop: 4 },

  // Two-column meta block
  metaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 18 },
  metaCell: { width: "50%", marginBottom: 10 },
  metaLabel: { fontSize: 7.5, letterSpacing: 1, color: C.muted, textTransform: "uppercase" },
  metaValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 2 },

  sectionHead: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.green, marginBottom: 8, marginTop: 6 },

  // Services
  svcGroup: { marginBottom: 12 },
  svcGroupTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.green, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 },
  svcRow: { flexDirection: "row", gap: 7, marginBottom: 4, paddingLeft: 2 },
  svcDot: { fontSize: 9, color: C.mint, fontFamily: "Helvetica-Bold", width: 8 },
  svcName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.ink },
  svcDetail: { fontSize: 8.5, color: C.muted, marginTop: 1 },

  incRow: { flexDirection: "row", gap: 7, marginBottom: 3, paddingLeft: 2 },
  incText: { fontSize: 9, color: "#444" },

  // Summary box
  summaryBox: { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, marginTop: 6, backgroundColor: C.cream },
  sumRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  sumLabel: { fontSize: 10, color: C.muted },
  sumValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink },
  sumDivider: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 4, marginBottom: 8 },
  sumTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.green },
  sumTotalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.green },
  statusPill: { alignSelf: "flex-start", marginTop: 10, backgroundColor: C.lightGreen, color: C.green, fontSize: 8.5, fontFamily: "Helvetica-Bold", paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10 },

  note: { fontSize: 8, color: C.muted, fontStyle: "italic", marginTop: 14 },

  // Footer
  footer: { position: "absolute", bottom: 26, left: 44, right: 44, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, alignItems: "center" },
  footerCompany: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.green },
  footerLine: { fontSize: 7.5, color: C.muted, marginTop: 2, textAlign: "center" },
});

function Header({ logo, title, ref: docRef }: { logo: string | null; title: string; ref: string }) {
  return (
    <View style={s.header}>
      <View style={s.brandRow}>
        {logo ? (
          <View style={s.logoBox}>
            <Image src={logo} style={s.logoImg} />
          </View>
        ) : null}
        <View>
          <Text style={s.brandName}>Vertex Kashmir</Text>
          <Text style={s.brandSub}>HOLIDAYS</Text>
        </View>
      </View>
      <View style={s.docMeta}>
        <Text style={s.docTitle}>{title}</Text>
        <Text style={s.docRef}>{docRef}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerCompany}>{CONTACT.company}</Text>
      <Text style={s.footerLine}>{CONTACT.reg}</Text>
      <Text style={s.footerLine}>
        {CONTACT.phone}  ·  {CONTACT.email}
      </Text>
      <Text style={s.footerLine}>{CONTACT.address}</Text>
    </View>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metaCell}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

const KIND_TITLES: Record<PdfService["kind"], string> = {
  HOTEL: "Accommodation",
  TRANSPORT: "Transport",
  ACTIVITY: "Activities",
  OTHER: "Other Inclusions",
};

// Structured, labelled detail line for a service — never includes price. Mirrors
// the admin services UI columns (Hotel: Location/Nights, Transport: Pickup/Drop,
// Activity: Duration/Location).
function serviceDetail(svc: PdfService): string {
  const fields: { label: string; value: string }[] = [];
  switch (svc.kind) {
    case "HOTEL":
      if (svc.location) fields.push({ label: "Location", value: svc.location });
      if (svc.nights != null) fields.push({ label: "Nights", value: `${svc.nights} night${svc.nights === 1 ? "" : "s"}` });
      break;
    case "TRANSPORT":
      if (svc.pickup) fields.push({ label: "Pickup", value: svc.pickup });
      if (svc.dropoff) fields.push({ label: "Drop", value: svc.dropoff });
      break;
    case "ACTIVITY":
      if (svc.timing) fields.push({ label: "Duration", value: svc.timing });
      if (svc.location) fields.push({ label: "Location", value: svc.location });
      break;
    default:
      break;
  }
  return fields.map((f) => `${f.label}: ${f.value}`).join("  ·  ");
}

// Booking summary — rich service detail, NO per-service prices, overall price
// summary visible.
export function BookingSummaryPdf({ data, logo }: { data: BookingSummaryPdfData; logo: string | null }) {
  const grouped = (["HOTEL", "TRANSPORT", "ACTIVITY", "OTHER"] as const)
    .map((kind) => ({ kind, items: data.services.filter((x) => x.kind === kind) }))
    .filter((g) => g.items.length > 0);

  return (
    <Document title={`Booking Summary - ${data.bookingRef}`} author={CONTACT.brand}>
      <Page size="A4" style={s.page}>
        <Header logo={logo} title="BOOKING SUMMARY" ref={`Ref: ${data.bookingRef}`} />

        <View style={s.metaGrid}>
          <MetaCell label="Guest" value={data.guestName} />
          <MetaCell label="Booking Reference" value={data.bookingRef} />
          <MetaCell label="Travel Date" value={data.travelDate} />
          <MetaCell label="Travellers" value={String(data.travellers)} />
        </View>

        <Text style={s.sectionHead}>Your Package Includes</Text>
        {grouped.length === 0 ? (
          <Text style={s.svcDetail}>Service details will be shared shortly.</Text>
        ) : (
          grouped.map((g) => (
            <View key={g.kind} style={s.svcGroup}>
              <Text style={s.svcGroupTitle}>{KIND_TITLES[g.kind]}</Text>
              {g.items.map((svc, i) => {
                const detail = serviceDetail(svc);
                return (
                  <View key={i} style={s.svcRow} wrap={false}>
                    <Text style={s.svcDot}>•</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.svcName}>{svc.name}</Text>
                      {detail ? <Text style={s.svcDetail}>{detail}</Text> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}

        {data.inclusions.length > 0 && (
          <View style={s.svcGroup}>
            <Text style={s.svcGroupTitle}>Additional Inclusions</Text>
            {data.inclusions.map((inc, i) => (
              <View key={i} style={s.incRow} wrap={false}>
                <Text style={s.svcDot}>+</Text>
                <Text style={s.incText}>{inc}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.sectionHead}>Price Summary</Text>
        <View style={s.summaryBox}>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Total Booking Amount</Text>
            <Text style={s.sumValue}>{inr(data.bookingAmount)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Discount</Text>
              <Text style={s.sumValue}>- {inr(data.discountAmount)}</Text>
            </View>
          )}
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Payable</Text>
            <Text style={s.sumValue}>{inr(data.effectivePayable)}</Text>
          </View>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Paid</Text>
            <Text style={s.sumValue}>{inr(data.paidAmount)}</Text>
          </View>
          <View style={s.sumDivider} />
          <View style={s.sumRow}>
            <Text style={s.sumTotalLabel}>Remaining Balance</Text>
            <Text style={s.sumTotalValue}>{inr(data.balance)}</Text>
          </View>
          <Text style={s.statusPill}>Status: {data.statusLabel}</Text>
        </View>

        <Text style={s.note}>
          *Service inclusions are confirmed as above. Final accommodation and transport are subject to
          availability at the time of travel. This is a computer-generated summary.
        </Text>

        <Footer />
      </Page>
    </Document>
  );
}

// Payment invoice — payment-specific financials only. No service line items.
export function PaymentInvoicePdf({ data, logo }: { data: PaymentInvoicePdfData; logo: string | null }) {
  return (
    <Document title={`Payment Receipt - ${data.invoiceRef}`} author={CONTACT.brand}>
      <Page size="A4" style={s.page}>
        <Header logo={logo} title="PAYMENT RECEIPT" ref={`Receipt: ${data.invoiceRef}`} />

        <View style={s.metaGrid}>
          <MetaCell label="Customer" value={data.customerName} />
          <MetaCell label="Booking Reference" value={data.bookingRef} />
          <MetaCell label="Payment Date" value={data.paymentDate} />
          <MetaCell label="Payment Type" value={data.type} />
          {data.method ? <MetaCell label="Method" value={data.method} /> : null}
        </View>

        <Text style={s.sectionHead}>Payment Details</Text>
        <View style={s.summaryBox}>
          <View style={s.sumRow}>
            <Text style={s.sumTotalLabel}>Amount Received</Text>
            <Text style={s.sumTotalValue}>{inr(data.amount)}</Text>
          </View>
          <View style={s.sumDivider} />
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Total Payable</Text>
            <Text style={s.sumValue}>{inr(data.effectivePayable)}</Text>
          </View>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Total Paid To Date</Text>
            <Text style={s.sumValue}>{inr(data.totalPaid)}</Text>
          </View>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Remaining Balance</Text>
            <Text style={s.sumValue}>{inr(data.balance)}</Text>
          </View>
          <Text style={s.statusPill}>Status: {data.statusLabel}</Text>
        </View>

        <Text style={s.note}>
          *This receipt confirms the payment recorded above against your booking. For the full booking
          summary please refer to your booking summary document. This is a computer-generated receipt.
        </Text>

        <Footer />
      </Page>
    </Document>
  );
}
