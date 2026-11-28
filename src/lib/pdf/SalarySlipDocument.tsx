// Salary slip PDF — reuses the exact Header/Footer/Watermark shell as the
// booking invoice/receipt documents (InvoiceDocuments.tsx) and the same
// PDF_COLORS palette and card layout as the receipt, so every outbound Vertex
// document looks like it came from the same company. Earnings/Deductions sit
// side by side (industry-standard payslip layout).

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Header, Footer, Watermark, amountInWords, sharedPdfStyles as s } from "./InvoiceDocuments";
import { PDF_COLORS as C, PDF_CONTACT as CONTACT, inr } from "./assets";

export interface SalarySlipPdfData {
  salaryMonthLabel: string;
  employeeName: string;
  employeeCode: string | null;
  designation: string | null;
  joiningDate: string | null;
  monthlySalary: number;
  commission: number;
  paidDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidDate: string | null;
  paymentReference: string | null;
}

const t = StyleSheet.create({
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

  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 14,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.green,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cardHeadText: {
    color: C.white,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  payRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  payCol: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: "hidden" },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  lineLabel: { fontSize: 9.5, color: C.muted },
  lineValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.ink },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.lightGreen,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalLabel: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.green },
  totalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.green },

  attRow: { flexDirection: "row" },
  attCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  attLabel: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  attValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 3 },

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
    textTransform: "uppercase",
  },

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

function CardHead({ left, right }: { left: string; right?: string }) {
  return (
    <View style={t.cardHead}>
      <Text style={t.cardHeadText}>{left}</Text>
      {right ? <Text style={t.cardHeadText}>{right}</Text> : null}
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={t.line}>
      <Text style={t.lineLabel}>{label}</Text>
      <Text style={t.lineValue}>{value}</Text>
    </View>
  );
}

export function SalarySlipPdf({
  data,
  logo,
  address,
}: {
  data: SalarySlipPdfData;
  logo: string | null;
  address: string;
}) {
  const grossEarnings = data.monthlySalary + data.commission;
  const info = [
    { label: "Employee Name", value: data.employeeName, flex: 2 },
    { label: "Employee ID", value: data.employeeCode ?? "—", flex: 1.1 },
    { label: "Designation", value: data.designation ?? "—", flex: 1.6 },
    ...(data.joiningDate ? [{ label: "Joining Date", value: data.joiningDate, flex: 1.2 }] : []),
    { label: "Pay Period", value: data.salaryMonthLabel, flex: 1.3 },
  ];
  const attendance = [
    { label: "Paid Days", value: data.paidDays },
    { label: "Absent Days", value: data.absentDays },
    { label: "Paid Leave", value: data.paidLeaveDays },
    { label: "Leave Without Pay", value: data.unpaidLeaveDays },
  ];
  const notes = [
    "Net Salary = Gross Earnings - Total Deductions.",
    "This is a computer-generated salary slip and does not require a signature.",
  ];

  return (
    <Document title={`Salary Slip - ${data.salaryMonthLabel}`} author={CONTACT.brand}>
      <Page size="A4" style={s.page}>
        <View style={t.topBar} fixed />
        <Watermark logo={logo} />
        <Header logo={logo} title="SALARY SLIP" ref={`Pay Period: ${data.salaryMonthLabel}`} />

        <View style={t.infoCard}>
          {info.map((f, i) => (
            <View
              key={f.label}
              style={[t.infoCell, { flex: f.flex }, i === info.length - 1 ? { paddingRight: 0 } : {}]}
            >
              <Text style={t.infoLabel}>{f.label}</Text>
              <Text style={t.infoValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* Earnings | Deductions — equal-height cards, totals pinned to the bottom. */}
        <View style={t.payRow} wrap={false}>
          <View style={t.payCol}>
            <CardHead left="Earnings" right="Amount" />
            <Line label="Monthly Salary" value={inr(data.monthlySalary)} />
            <Line label="Booking Commission" value={inr(data.commission)} />
            <View style={{ flexGrow: 1 }} />
            <View style={t.totalRow}>
              <Text style={t.totalLabel}>Gross Earnings</Text>
              <Text style={t.totalValue}>{inr(grossEarnings)}</Text>
            </View>
          </View>
          <View style={t.payCol}>
            <CardHead left="Deductions" right="Amount" />
            <Line label="Deductions" value={inr(data.deductions)} />
            <View style={{ flexGrow: 1 }} />
            <View style={t.totalRow}>
              <Text style={t.totalLabel}>Total Deductions</Text>
              <Text style={t.totalValue}>{inr(data.deductions)}</Text>
            </View>
          </View>
        </View>

        <View style={t.card} wrap={false}>
          <CardHead left="Attendance" />
          <View style={t.attRow}>
            {attendance.map((a, i) => (
              <View key={a.label} style={i === 0 ? [t.attCell, { borderLeftWidth: 0 }] : t.attCell}>
                <Text style={t.attLabel}>{a.label}</Text>
                <Text style={t.attValue}>{a.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={t.hero} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={t.heroLabel}>Net Salary</Text>
            <Text style={t.heroValue}>{inr(data.netSalary)}</Text>
            <Text style={t.heroWords}>{amountInWords(data.netSalary)}</Text>
          </View>
          <Text style={t.heroStamp}>{data.status}</Text>
        </View>

        <View style={t.card} wrap={false}>
          <CardHead left="Payment Details" />
          <Line label="Status" value={data.status} />
          {data.paidDate ? <Line label="Paid Date" value={data.paidDate} /> : null}
          {data.paymentReference ? (
            <Line label="Payment Reference" value={data.paymentReference} />
          ) : null}
        </View>

        <View style={t.card} wrap={false}>
          <CardHead left="Notes" />
          {notes.map((n, i) => (
            <View key={i} style={t.noteRow}>
              <Text style={t.noteNum}>{i + 1}.</Text>
              <Text style={t.noteText}>{n}</Text>
            </View>
          ))}
        </View>

        <Footer address={address} cornerIcon={logo} />
      </Page>
    </Document>
  );
}
