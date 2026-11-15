/* eslint-disable jsx-a11y/alt-text */
// Offer cum Appointment Letter PDF (react-pdf). Mirrors docs/Vertex-Appointment-
// Letter-Template.pdf: logo header, gold rules, diagonal watermark, photo box,
// numbered clauses, signature and acceptance block. Every variable line comes
// from OfferLetterData — nothing here reads the database.
//
// Amounts print as "Rs." — the built-in PDF fonts have no ₹ glyph (same as the
// booking invoices).
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { amountInWords } from "@/lib/pdf/InvoiceDocuments";
import { PDF_CONTACT } from "@/lib/pdf/contact";
import {
  COMMON_DUTIES,
  DEPARTMENTS,
  LETTER_PLACE,
  SIGNATORY,
  headerDate,
  longDate,
  smallNumberWord,
  termEndDate,
  type OfferLetterData,
} from "./schema";

const NAVY = "#13294b";
const GOLD = "#c8a04a";
const INK = "#2b2b2b";
const MUTED = "#6b7280";

const s = StyleSheet.create({
  page: {
    paddingTop: 112,
    paddingBottom: 78,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.45,
    color: INK,
  },
  header: { position: "absolute", top: 26, left: 56, right: 56, alignItems: "center" },
  logo: { width: 150, height: 47 },
  tagline: { marginTop: 4, fontSize: 7.5, letterSpacing: 2.2, color: MUTED },
  headerRule: { marginTop: 7, alignSelf: "stretch", borderBottomWidth: 1, borderBottomColor: GOLD },
  footer: { position: "absolute", bottom: 26, left: 56, right: 56, alignItems: "center" },
  footerRule: { alignSelf: "stretch", borderTopWidth: 1, borderTopColor: GOLD, marginBottom: 5 },
  footerCompany: { fontFamily: "Times-Bold", fontSize: 9.5, color: NAVY },
  footerLine: { fontSize: 7.5, color: MUTED, marginTop: 1 },
  watermark: {
    position: "absolute",
    top: 400,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 52,
    color: "#ececec",
    transform: "rotate(-40deg)",
    transformOrigin: "center",
    fontFamily: "Helvetica",
  },
  title: { fontFamily: "Times-Bold", fontSize: 22, color: NAVY, textAlign: "center", lineHeight: 1.2 },
  confidential: {
    marginTop: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 2.4,
    color: GOLD,
    textAlign: "center",
  },
  rule: { marginTop: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: GOLD },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  toRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  toBlock: { flex: 1, paddingRight: 16 },
  photoBox: {
    width: 108,
    height: 132,
    borderWidth: 1,
    borderColor: "#c9c3b5",
    backgroundColor: "#fbf8f1",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  photoText: { fontSize: 7.5, color: MUTED, textAlign: "center" },
  subject: { marginTop: 22, fontFamily: "Helvetica-Bold" },
  // Indented body text; headings sit flush left.
  para: { textAlign: "justify", marginTop: 6, paddingLeft: 18 },
  flush: { paddingLeft: 0 },
  sectionTitle: { marginTop: 13, fontFamily: "Times-Bold", fontSize: 13, color: NAVY },
  bulletRow: { flexDirection: "row", marginTop: 3 },
  bulletDash: { width: 14 },
  bulletText: { flex: 1, textAlign: "justify" },
  closing: { marginTop: 40 },
  signImg: { width: 110, height: 66, marginTop: 4 },
  signRule: { marginTop: 4, borderBottomWidth: 0.6, borderBottomColor: "#9aa3b2" },
  acceptTitle: { marginTop: 22, fontFamily: "Times-Bold", fontSize: 13, color: NAVY },
  lineRow: { flexDirection: "row", marginTop: 22 },
  lineLabel: { width: 270 },
});

// Whole words only — never "re-viewed" / "engage-ment" splits in a contract.
const noHyphenation = (word: string) => [word];

/** Justified paragraph. */
function P({ children }: { children: ReactNode }) {
  return (
    <Text style={s.para} hyphenationCallback={noHyphenation}>
      {children}
    </Text>
  );
}

/** Inline bold run. */
const B = ({ children }: { children: ReactNode }) => <Text style={s.bold}>{children}</Text>;

// Heading and body are siblings (no wrapping View) so minPresenceAhead can
// pull a heading onto the next page instead of leaving it alone at the bottom.
function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <>
      <Text style={s.sectionTitle} minPresenceAhead={60}>
        {n}. {title}
      </Text>
      {children}
    </>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <View style={{ marginTop: 4, paddingLeft: 18 }}>
      {items.map((item, i) => (
        <View key={i} style={s.bulletRow} wrap={false}>
          <Text style={s.bulletDash}>–</Text>
          <Text style={s.bulletText} hyphenationCallback={noHyphenation}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

const rs = (n: number) => `Rs. ${n.toLocaleString("en-IN")}/-`;
const months = (n: number) => `${smallNumberWord(n)} (${n}) month${n === 1 ? "" : "s"}`;

export function OfferLetterPdf({
  data,
  refNo,
  logo,
  signature,
}: {
  data: OfferLetterData;
  refNo: string;
  logo: string | null;
  signature: string | null;
}) {
  const dept = DEPARTMENTS[data.department];
  const intern = data.engagementType === "INTERNSHIP";
  const pay = intern ? "stipend" : "salary";
  const Pay = intern ? "Stipend" : "Salary";
  const basis = intern ? "Internship" : "Employment";
  const { terms } = data;
  const termWords = `${terms.termMonths} (${smallNumberWord(terms.termMonths)}) months`;
  const endDate = termEndDate(data.joiningDate, terms.termMonths);
  const addressLines = data.address.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Clauses are numbered in order; probation is dropped when it is 0 months.
  const sections: { title: string; body: ReactNode }[] = [
    {
      title: "Designation & Reporting",
      body: (
        <P>
          You are appointed as <B>{data.designation}</B> in the <B>{dept.team}</B>, and will report to{" "}
          <B>{data.reportingOfficer}</B> or any other reporting officer assigned by the Company. You may also be
          assigned related duties and responsibilities as reasonably required by the Company from time to time.
        </P>
      ),
    },
    {
      title: data.commissionPct > 0 ? `${Pay}, Incentive & Benefits` : `${Pay} & Benefits`,
      body: (
        <P>
          Your consolidated monthly {pay} shall be <B>{rs(data.monthlyAmount)}</B> (<B>{amountInWords(data.monthlyAmount)}</B>).
          {data.commissionPct > 0 ? (
            <>
              {" "}In addition, you shall be eligible for a booking incentive of{" "}
              <B>{data.commissionPct}% of the net profit</B> on every tour booking converted by you. Net profit means
              the booking amount received after any discount, less the cost of all services (hotels, transport,
              activities and the like) and the GST paid on the booking. The incentive is earned only after the tour is
              completed and the customer has paid the booking in full, and is paid with your {pay} for the month in
              which the tour is completed, i.e. in the following month; no incentive is payable on bookings that are
              cancelled or refunded. The Company’s booking records shall be final for this calculation.
            </>
          ) : null}{" "}
          The {pay} shall normally be disbursed on or before the <B>{terms.payDay}th day of the following month</B>,
          subject to attendance, completion of assigned responsibilities, and Company policies. All applicable
          statutory deductions, if any, shall be made as per law.
        </P>
      ),
    },
    {
      title: "Engagement Type & Term",
      body: (
        <P>
          This engagement is on an <B>{basis}</B> basis for an initial fixed term of <B>{termWords}</B>, commencing{" "}
          <B>{longDate(data.joiningDate)}</B> and ending on <B>{longDate(endDate)}</B>. On completion of this term, your
          engagement shall continue, and your designation and {pay} shall be reviewed on the basis of your
          performance during these {smallNumberWord(terms.termMonths)} months. A revision will be considered only where
          your overall KPI score for the period is <B>{terms.kpiThresholdPct}% or more</B>; the outcome of the review
          will be communicated to you in writing.
        </P>
      ),
    },
    ...(data.probationMonths > 0
      ? [
          {
            title: "Probation / Training Period",
            body: (
              <P>
                You will initially serve a probation / training period of <B>{months(data.probationMonths)}</B> from
                the date of joining. During this period, your work performance, punctuality, conduct, learning, and
                overall suitability will be reviewed. Upon satisfactory completion, your engagement will continue in
                accordance with this letter. The Company may extend the review period or discontinue the engagement
                during this period based on performance or operational requirements.
              </P>
            ),
          },
        ]
      : []),
    {
      title: "Working Hours & Attendance",
      body: (
        <>
          <P>Your regular working schedule shall be:</P>
          <Bullets
            items={[
              <>
                <B>Summer Season (April – September):</B> 10:00 AM to 5:00 PM
              </>,
              <>
                <B>Winter Season (October – March):</B> 10:00 AM to 4:00 PM
              </>,
            ]}
          />
          <P>
            Working days shall be Monday to Saturday, with Sunday as the weekly off, along with gazetted holidays
            observed by the Company as applicable in Jammu & Kashmir, and a reasonable break during office hours.
            Depending upon operational requirements, project timelines, customer support, or peak-season schedules,
            working hours may occasionally be adjusted or extended by the Company. Regular attendance and punctuality
            are expected; habitual late attendance or unauthorized absence may attract disciplinary action.
          </P>
        </>
      ),
    },
    {
      title: "Leave Policy",
      body: (
        <P>
          You shall be entitled to <B>{terms.annualLeaves} paid leaves annually</B>, calculated proportionately during
          the year, in addition to weekly offs and official holidays declared by the Company.
          {intern ? " For internships, leave shall be granted proportionately for the internship term." : ""} Leave
          should preferably be applied for at least 3 days in advance, except in emergencies. Unauthorized absence,
          habitual late attendance, or excessive leave may result in deduction or disciplinary action as per Company
          policy.
        </P>
      ),
    },
    {
      title: "Duties & Responsibilities",
      body: (
        <>
          <P>
            You shall diligently perform the duties of your role and any other reasonable tasks assigned by the
            Company. Your key responsibilities include, but are not limited to:
          </P>
          <Bullets items={[...data.duties, ...COMMON_DUTIES]} />
        </>
      ),
    },
    {
      title: "Professional Conduct & Confidentiality",
      body: (
        <P>
          You are expected to maintain professional behaviour, honesty, discipline, punctuality, and respectful
          communication while representing Vertex Kashmir Holidays. You shall maintain strict confidentiality, both
          during and after your engagement, regarding customer information, pricing, internal business operations,
          company documents, source code, login credentials, marketing data, and any financial or operational data.
          Any misuse, unauthorized disclosure, misconduct, fraud, harassment, or conduct affecting the Company’s
          reputation may lead to disciplinary action, including termination of engagement.
        </P>
      ),
    },
    {
      title: "Intellectual Property & Work Product",
      body: (
        <P>
          All work, materials, code, designs, content, data, and other deliverables created by you in the course of
          your engagement shall be the sole and exclusive property of Vertex Kashmir Holidays. You shall not copy,
          reuse, publish, or share any such work, credentials, or company assets outside the Company without prior
          written permission. Upon completion or termination of engagement, all such materials, accounts, and access
          shall be handed over to the Company.
        </P>
      ),
    },
    {
      title: "Company Property, Systems & Communication",
      body: (
        <P>
          Any devices, accounts, credentials, or assets provided to you shall be used solely for official purposes
          and handled responsibly. All official communication with customers, vendors, or team members must be
          conducted professionally and only through the Company’s official channels (official email, WhatsApp,
          office numbers, and approved tools). Personal or unauthorized use of Company systems, accounts, or data is
          not permitted.
        </P>
      ),
    },
    {
      title: "Performance Expectations",
      body: (
        <P>
          The Company will assign reasonable targets, deliverables, or learning objectives (KPIs) based on your role
          and business requirements. Your performance will be evaluated periodically based on quality of work,
          productivity, reliability, communication, teamwork, attendance, and overall efficiency. An overall KPI score
          of <B>{terms.kpiThresholdPct}% or more</B> over the initial {smallNumberWord(terms.termMonths)}-month term is
          required for any revision of your designation and {pay}.
          {data.department === "SALES"
            ? " For the sales role, KPIs include monthly booking targets, lead response time, follow-up discipline and conversion rate."
            : ""}
        </P>
      ),
    },
    {
      title: "Notice Period, Termination & Resignation",
      body: (
        <P>
          After successful completion of probation, either party may end the engagement by giving{" "}
          <B>{months(data.noticeMonths)}</B> prior written notice, or payment / recovery in lieu of notice where
          applicable, subject to Clause {data.probationMonths > 0 ? 13 : 12} below. During the probation / training
          period, the engagement may be ended with shorter notice based on performance or operational requirements.
          The Company reserves the right to terminate the engagement <B>without notice</B> in cases involving serious
          misconduct, fraud, breach of confidentiality, harassment, misuse of company property or systems, or
          violation of Company policies.
        </P>
      ),
    },
    {
      title: "Service Commitment, Early Exit & Handover",
      body: (
        <>
          <P>
            This engagement is made with the expectation of a sincere and continuous professional association for the
            initial term of {termWords}. The Company invests time, training, knowledge, and resources in developing
            its people; accordingly, you are expected to maintain commitment, continuity, and responsible conduct
            during this period.
          </P>
          <P>
            If you resign, leave, or abandon the engagement before completing the initial term of{" "}
            <B>{termWords}</B> without the Company’s prior written consent, you shall pay the Company{" "}
            <B>{rs(terms.earlyExitAmount)}</B> (<B>{amountInWords(terms.earlyExitAmount)}</B>) as liquidated damages
            towards the training, onboarding, and resources invested in you. This amount may be adjusted against any
            dues payable to you at the time of final settlement. This clause does not apply where the Company itself
            ends the engagement.
          </P>
          <P>
            Upon resignation, completion, or termination, you shall complete a proper handover of work, records,
            customer data, code, credentials, and company property before final settlement. Nothing in this clause
            restricts the Company’s right to take disciplinary action or terminate the engagement for misconduct,
            policy violation, breach of confidentiality, fraud, or unsatisfactory performance.
          </P>
        </>
      ),
    },
    {
      title: "General",
      body: (
        <P>
          This letter, together with the Company’s policies (as amended from time to time), constitutes the terms of
          your engagement and supersedes any prior understanding. The Company may amend its policies and your duties
          as reasonably required. This engagement shall be governed by the applicable laws of Jammu & Kashmir / India,
          and any dispute shall be subject to the jurisdiction of the competent courts at Baramulla, Jammu & Kashmir.
          Any matter not expressly covered here shall be dealt with as per Company policy and management discretion.
        </P>
      ),
    },
  ];

  return (
    <Document title={`Offer cum Appointment Letter — ${data.fullName}`} author="Vertex Kashmir Holidays">
      <Page size="A4" style={s.page}>
        <Text style={s.watermark} fixed>
          Vertex Kashmir Holidays
        </Text>

        <View style={s.header} fixed>
          {logo ? <Image src={logo} style={s.logo} /> : <Text style={s.title}>Vertex Kashmir Holidays</Text>}
          <Text style={s.tagline}>CURATED KASHMIR HOLIDAYS · GULMARG, JAMMU & KASHMIR</Text>
          <View style={s.headerRule} />
        </View>

        <View style={s.footer} fixed>
          <View style={s.footerRule} />
          <Text style={s.footerCompany}>{PDF_CONTACT.company}</Text>
          <Text style={s.footerLine}>
            vertexkashmirholidays.com | {SIGNATORY.phone} | {SIGNATORY.email}
          </Text>
          <Text style={s.footerLine}>Reg: JKEA00001840 | {LETTER_PLACE}</Text>
        </View>

        <Text style={s.title}>Offer cum Appointment Letter</Text>
        <Text style={s.confidential}>PRIVATE & CONFIDENTIAL</Text>
        <View style={s.rule} />

        <Text>
          <B>Ref. No.: {refNo}</B>
        </Text>
        <Text>
          <B>Date: {headerDate(data.letterDate)}</B>
        </Text>
        <Text>
          <B>Place:</B> {LETTER_PLACE}
        </Text>

        <View style={s.toRow}>
          <View style={s.toBlock}>
            <Text style={s.bold}>To,</Text>
            <Text style={s.bold}>
              {data.title} {data.fullName}
            </Text>
            {data.guardianName ? <Text style={s.bold}>{data.guardianName}</Text> : null}
            {addressLines.map((line, i) => (
              <Text key={i} style={s.bold}>
                {line}
              </Text>
            ))}
          </View>
          <View style={s.photoBox}>
            <Text style={s.photoText}>Affix recent passport-size photograph</Text>
          </View>
        </View>

        <Text style={s.subject}>
          Subject: Offer cum Appointment Letter for the position of {data.designation}
        </Text>
        <Text style={{ marginTop: 6 }}>
          Dear <B>{data.title} {data.fullName}</B>,
        </Text>
        <P>
            We are pleased to offer you the position of <B>{data.designation}</B> at <B>Vertex Kashmir Holidays</B> on
            an <B>{basis}</B> basis. Your engagement shall be effective from <B>{longDate(data.joiningDate)}</B> and
            shall be governed by the terms and conditions set out in this letter, together with the Company’s
            policies, code of conduct, and the applicable rules under the laws governing private establishments in
            Jammu & Kashmir. This letter serves as both your offer and appointment letter.
            {intern ? " An Internship Completion Certificate will be issued upon successful completion of the internship." : ""}
        </P>

        {sections.map((sec, i) => (
          <Section key={sec.title} n={i + 1} title={sec.title}>
            {sec.body}
          </Section>
        ))}

        {/* Closing, signature and acceptance always share the last page. */}
        <View break wrap={false}>
          <Text style={[s.para, s.flush, s.closing]} hyphenationCallback={noHyphenation}>
            We warmly welcome you to <B>Vertex Kashmir Holidays</B> and trust that you will contribute meaningfully to
            our growth and success. Kindly sign and return a copy of this letter as confirmation of your acceptance of
            the terms and conditions stated above. For any clarification, please feel free to contact us.
          </Text>
          <Text style={{ marginTop: 16 }}>Warm regards,</Text>
          <Text style={[s.italic, s.bold]}>For Vertex Kashmir Holidays</Text>
          {signature ? <Image src={signature} style={s.signImg} /> : <View style={{ height: 50 }} />}
          <View style={s.signRule} />
          <Text style={[s.bold, { marginTop: 4 }]}>{SIGNATORY.name}</Text>
          <Text style={[s.italic, { color: MUTED }]}>{SIGNATORY.title}</Text>
          <Text style={{ color: MUTED }}>
            {SIGNATORY.phone} · {SIGNATORY.email}
          </Text>
          <Text style={{ color: MUTED }}>{SIGNATORY.website}</Text>

          <View style={[s.rule, { marginTop: 22 }]} />
          <Text style={s.acceptTitle}>Acceptance of Appointment</Text>
          <Text style={[s.para, s.flush]} hyphenationCallback={noHyphenation}>
            I, <B>{data.fullName}</B>, have read and understood the terms and conditions set out in this letter,
            including the initial term of {termWords} and the early-exit clause, and hereby accept this appointment as{" "}
            <B>{data.designation}</B> with Vertex Kashmir Holidays.
          </Text>
          <View style={s.lineRow}>
            <Text style={s.lineLabel}>Signature: ______________________________</Text>
            <Text>Date: ____________________</Text>
          </View>
          <View style={s.lineRow}>
            <Text style={s.lineLabel}>Name: ________________________________</Text>
            <Text>Place: ___________________</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
