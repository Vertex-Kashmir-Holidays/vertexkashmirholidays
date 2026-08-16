// Salary slip PDF — reuses the exact Header/Footer/MetaCell shell as the
// booking invoice/receipt documents (InvoiceDocuments.tsx) and the same
// PDF_COLORS palette, so every outbound Vertex document looks like it came
// from the same company. Earnings/Deductions render as a real bordered
// table (industry-standard payslip layout) rather than a stacked summary box.

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Header, Footer, MetaCell, sharedPdfStyles as s } from "./InvoiceDocuments";
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
  payRow: { flexDirection: "row", gap: 10 },
  payCol: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: "hidden" },
  // Same visual as payCol but for a standalone (non-row) table — no flex:1,
  // which would otherwise stretch to fill the page's remaining height.
  soloCol: { alignSelf: "stretch", borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: "hidden" },
  head: { flexDirection: "row", backgroundColor: C.lightGreen, borderBottomWidth: 1, borderBottomColor: C.border },
  headLabel: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    paddingVertical: 5,
    paddingHorizontal: 8,
    textTransform: "uppercase",
  },
  headValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    paddingVertical: 5,
    paddingHorizontal: 8,
    textTransform: "uppercase",
    textAlign: "right",
  },
  line: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border },
  lineLabel: { flex: 1, fontSize: 9, color: C.muted, paddingVertical: 5, paddingHorizontal: 8 },
  lineValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    paddingVertical: 5,
    paddingHorizontal: 8,
    textAlign: "right",
  },
  totalRow: { flexDirection: "row", backgroundColor: C.cream },
  totalLabel: {
    flex: 1,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  totalValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: "right",
  },
  attTable: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  attCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  attCellLast: { borderRightWidth: 0 },
  attLabel: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  attValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 3 },
  netBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.green,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  netLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 0.5 },
  netValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.white },
});

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

  return (
    <Document title={`Salary Slip - ${data.salaryMonthLabel}`} author={CONTACT.brand}>
      <Page size="A4" style={s.page}>
        <Header logo={logo} title="SALARY SLIP" ref={data.salaryMonthLabel} />

        <View style={[s.metaGrid, { marginBottom: 12 }]}>
          <MetaCell label="Employee Name" value={data.employeeName} />
          <MetaCell label="Employee ID" value={data.employeeCode ?? "—"} />
          <MetaCell label="Designation" value={data.designation ?? "—"} />
          <MetaCell label="Pay Period" value={data.salaryMonthLabel} />
          {data.joiningDate ? <MetaCell label="Joining Date" value={data.joiningDate} /> : null}
        </View>

        <Text style={[s.sectionHead, { marginTop: 0 }]}>Earnings &amp; Deductions</Text>
        <View style={t.payRow}>
          <View style={t.payCol}>
            <View style={t.head} wrap={false}>
              <Text style={t.headLabel}>Earnings</Text>
              <Text style={t.headValue}>Amount</Text>
            </View>
            <View style={t.line}>
              <Text style={t.lineLabel}>Monthly Salary</Text>
              <Text style={t.lineValue}>{inr(data.monthlySalary)}</Text>
            </View>
            <View style={t.line}>
              <Text style={t.lineLabel}>Booking Commission</Text>
              <Text style={t.lineValue}>{inr(data.commission)}</Text>
            </View>
            <View style={t.totalRow}>
              <Text style={t.totalLabel}>Gross Earnings</Text>
              <Text style={t.totalValue}>{inr(grossEarnings)}</Text>
            </View>
          </View>

          <View style={t.payCol}>
            <View style={t.head} wrap={false}>
              <Text style={t.headLabel}>Deductions</Text>
              <Text style={t.headValue}>Amount</Text>
            </View>
            <View style={t.line}>
              <Text style={t.lineLabel}>Deductions</Text>
              <Text style={t.lineValue}>{inr(data.deductions)}</Text>
            </View>
            <View style={t.totalRow}>
              <Text style={t.totalLabel}>Total Deductions</Text>
              <Text style={t.totalValue}>{inr(data.deductions)}</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionHead}>Attendance</Text>
        <View style={t.attTable} wrap={false}>
          <View style={t.attCell}>
            <Text style={t.attLabel}>Paid Days</Text>
            <Text style={t.attValue}>{data.paidDays}</Text>
          </View>
          <View style={t.attCell}>
            <Text style={t.attLabel}>Absent Days</Text>
            <Text style={t.attValue}>{data.absentDays}</Text>
          </View>
          <View style={t.attCell}>
            <Text style={t.attLabel}>Paid Leave</Text>
            <Text style={t.attValue}>{data.paidLeaveDays}</Text>
          </View>
          <View style={[t.attCell, t.attCellLast]}>
            <Text style={t.attLabel}>Leave Without Pay</Text>
            <Text style={t.attValue}>{data.unpaidLeaveDays}</Text>
          </View>
        </View>

        <View style={t.netBar}>
          <Text style={t.netLabel}>NET SALARY</Text>
          <Text style={t.netValue}>{inr(data.netSalary)}</Text>
        </View>

        <Text style={s.sectionHead}>Payment Details</Text>
        <View style={t.soloCol}>
          <View style={data.paidDate || data.paymentReference ? t.line : { flexDirection: "row" }}>
            <Text style={t.lineLabel}>Status</Text>
            <Text style={t.lineValue}>{data.status}</Text>
          </View>
          {data.paidDate && (
            <View style={data.paymentReference ? t.line : { flexDirection: "row" }}>
              <Text style={t.lineLabel}>Paid Date</Text>
              <Text style={t.lineValue}>{data.paidDate}</Text>
            </View>
          )}
          {data.paymentReference && (
            <View style={{ flexDirection: "row" }}>
              <Text style={t.lineLabel}>Payment Reference</Text>
              <Text style={t.lineValue}>{data.paymentReference}</Text>
            </View>
          )}
        </View>

        <Text style={s.note}>Computer-generated salary statement.</Text>

        <Footer address={address} />
      </Page>
    </Document>
  );
}
