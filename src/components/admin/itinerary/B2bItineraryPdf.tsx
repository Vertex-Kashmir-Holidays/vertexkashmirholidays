/* eslint-disable jsx-a11y/alt-text */
// B2B itinerary PDF — the travel proposal a B2B partner forwards to their OWN
// customer. Same @react-pdf/renderer tooling and ItineraryData shape as the
// normal customer document (ItineraryPdf.tsx), laid out close to the
// proposal PDF (ProposalPdf.tsx): a full-bleed cover, one flowing body with
// section headings, and a closing page — in navy rather than the proposal's
// green, and without the photo-heavy styling of Vertex's own itinerary.
//
// Branding rules (see src/lib/b2b/whiteLabelEligibility.ts):
// - The AGENT's brand is the document's brand everywhere: logo, agency name,
//   phone, email, PDF metadata. Nothing in the rendered output says "B2B",
//   "partner" or "agent" — the end customer must only ever see their travel
//   company.
// - "Vertex Kashmir Holidays" appears ONLY as the small "Powered by" credit,
//   and only while the agency is below the white-label threshold
//   (`whiteLabel === false`). Fully white-labelled agencies get zero Vertex
//   mentions.
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ItineraryData, ItineraryStatus } from "@/types/itinerary";
import { PdfIcon } from "./ItineraryPdf";

export interface B2bAgentInfo {
  agencyName: string | null;
  /** Already a data: URI (agents upload PNG logos as base64, stored as-is — see src/lib/b2b/schema.ts). */
  agencyLogoUrl: string | null;
  phone: string | null;
  email: string;
}

// Vertex's navy primary with a soft gold accent (the site's dark-mode gold) —
// a distinct look from the green proposal PDF, not a brand mention.
const NAVY = "#0b203c";
const NAVY_MID = "#16304f";
const GOLD = "#D9BE7A";
const GOLD_PALE = "#EFE3C2";
const SKY = "#9FB6D3";
const GREEN = "#1d5c43";
const GREEN_LIGHT = "#E8F2EB";
const ROSE = "#b4233f";
const ROSE_LIGHT = "#FBEAEE";
const INK = "#1b2533";
const BODY = "#3d4756";
const MUTED = "#6f7888";
const BORDER = "#dde3eb";
const BORDER_LIGHT = "#edf1f5";
const BG_SUBTLE = "#f5f7fa";
const WHITE = "#ffffff";

const STATUS_LABEL: Record<ItineraryStatus, string> = {
  DRAFT: "TRAVEL PROPOSAL",
  SENT: "TRAVEL PROPOSAL",
  CONFIRMED: "CONFIRMED ITINERARY",
};

const s = StyleSheet.create({
  page: { fontSize: 9.5, color: INK, fontFamily: "Helvetica", paddingTop: 70, paddingBottom: 54 },
  body: { paddingHorizontal: 36 },

  // ── Cover ────────────────────────────────────────────────────────────────
  cover: { backgroundColor: NAVY, padding: 0 },
  coverContent: { padding: 40, height: "100%" },
  coverBrandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  // White badge behind the agent's logo so any logo colour stays visible on navy.
  coverLogoChip: {
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 8,
    alignSelf: "flex-start",
  },
  coverLogo: { height: 44, maxWidth: 200, objectFit: "contain" },
  coverAgency: { fontSize: 18, fontFamily: "Helvetica-Bold", color: WHITE },
  coverRefBox: { alignItems: "flex-end" },
  coverRefLabel: { fontSize: 7.5, letterSpacing: 1.4, color: GOLD },
  coverRefValue: { fontSize: 10, color: WHITE, marginTop: 4 },
  coverRefDate: { fontSize: 8.5, color: SKY, marginTop: 2 },

  coverTitleBlock: { marginTop: 96 },
  coverKicker: { fontSize: 8.5, letterSpacing: 2.5, color: GOLD, marginBottom: 12 },
  coverTitle: { fontSize: 42, fontFamily: "Helvetica-Bold", color: WHITE, lineHeight: 1.05 },
  coverSubtitle: { fontSize: 30, color: GOLD_PALE, lineHeight: 1.15, marginTop: 2 },
  coverDivider: { width: 48, height: 2, backgroundColor: GOLD, marginTop: 20, marginBottom: 14 },
  coverDest: { fontSize: 11, color: SKY, lineHeight: 1.6, maxWidth: 380 },

  coverPreparedFor: { flex: 1, alignItems: "center", justifyContent: "center" },
  coverPreparedLabel: { fontSize: 11, letterSpacing: 7, color: GOLD },
  coverPreparedName: { fontSize: 26, fontFamily: "Helvetica-Bold", color: WHITE, marginTop: 10 },

  coverBottom: { marginTop: "auto" },
  coverStatRow: {
    flexDirection: "row",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217,190,122,0.35)",
  },
  coverStatCol: { flex: 1 },
  coverStatLabel: { fontSize: 8, color: GOLD, letterSpacing: 1.2 },
  coverStatValue: { fontSize: 13.5, color: WHITE, fontFamily: "Helvetica-Bold", marginTop: 5 },
  coverPriceBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "rgba(217,190,122,0.10)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverPriceLabel: { fontSize: 8, color: GOLD, letterSpacing: 1.4 },
  coverPriceNote: { fontSize: 8, color: SKY, marginTop: 4 },
  coverPriceValue: { fontSize: 22, color: WHITE, fontFamily: "Helvetica-Bold" },
  coverNote: {
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(159,182,211,0.35)",
    backgroundColor: "rgba(159,182,211,0.08)",
  },
  coverNoteTitle: { fontSize: 7.5, letterSpacing: 1.4, color: GOLD, fontFamily: "Helvetica-Bold" },
  coverNoteText: { fontSize: 8.5, color: "#C9D6E6", lineHeight: 1.5, marginTop: 4 },
  coverFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(159,182,211,0.2)",
  },
  coverFooterText: { fontSize: 7.5, color: SKY },

  // ── Running header / footer (body + closing pages) ───────────────────────
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: NAVY,
    paddingHorizontal: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLogoChip: { backgroundColor: WHITE, borderRadius: 6, padding: 4 },
  headerLogo: { height: 26, maxWidth: 130, objectFit: "contain" },
  headerAgency: { fontSize: 12, fontFamily: "Helvetica-Bold", color: WHITE },
  headerRight: { alignItems: "flex-end" },
  headerBadge: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.4 },
  headerMeta: { fontSize: 7, color: SKY, marginTop: 3 },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: MUTED },
  poweredByRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  poweredByIcon: { width: 8, height: 8 },
  poweredByText: { fontSize: 6, color: MUTED },

  // ── Section heading (proposal-style: title + right-aligned tag + rule) ──
  secHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
    marginTop: 24,
    marginBottom: 12,
  },
  secHead: { fontSize: 15, fontFamily: "Helvetica-Bold", color: NAVY },
  secTag: { fontSize: 7.5, letterSpacing: 1.4, color: MUTED },

  // ── Tables ───────────────────────────────────────────────────────────────
  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 10, overflow: "hidden" },
  tHeadRow: { flexDirection: "row", backgroundColor: NAVY },
  tHeadCell: { fontSize: 7.5, color: GOLD, letterSpacing: 1, paddingVertical: 8, paddingHorizontal: 9 },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: BORDER_LIGHT },
  tRowAlt: { backgroundColor: BG_SUBTLE },
  tCell: { fontSize: 9, color: BODY, lineHeight: 1.45, paddingVertical: 9, paddingHorizontal: 9 },
  tCellStrong: { fontSize: 9.3, color: INK, fontFamily: "Helvetica-Bold", lineHeight: 1.4 },
  dayNum: { fontSize: 13, fontFamily: "Helvetica-Bold", color: GOLD },
  dayBody: { fontSize: 8.7, color: BODY, lineHeight: 1.45, marginTop: 2 },
  tableNote: { fontSize: 8, color: MUTED, marginTop: 7, lineHeight: 1.5, fontStyle: "italic" },

  // ── Activities ───────────────────────────────────────────────────────────
  actGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actCard: {
    width: "48.5%",
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 11,
    alignItems: "center",
  },
  actIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  actName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: INK },
  actMeta: { fontSize: 8.3, color: MUTED, marginTop: 2 },
  actTags: { flexDirection: "row", gap: 5, marginTop: 5 },
  actTagIncluded: {
    fontSize: 7,
    color: GREEN,
    backgroundColor: GREEN_LIGHT,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  actTagDay: {
    fontSize: 7,
    color: NAVY_MID,
    backgroundColor: BG_SUBTLE,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    letterSpacing: 0.5,
  },

  // ── Price card ───────────────────────────────────────────────────────────
  priceCard: {
    marginTop: 18,
    borderRadius: 10,
    backgroundColor: NAVY,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: { fontSize: 8, color: GOLD, letterSpacing: 1.5 },
  priceCaption: { fontSize: 8, color: SKY, marginTop: 4 },
  priceValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: WHITE },

  // ── What's Covered ───────────────────────────────────────────────────────
  twoCol: { flexDirection: "row", gap: 14 },
  coveredCard: { flex: 1, borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  coveredHead: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 9, paddingHorizontal: 12 },
  coveredHeadText: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: WHITE },
  coveredBody: { padding: 12 },
  coveredRow: { flexDirection: "row", gap: 6, marginBottom: 5 },
  coveredText: { flex: 1, fontSize: 9, color: BODY, lineHeight: 1.5 },

  // ── Payment & Cancellation ───────────────────────────────────────────────
  termsCard: { borderWidth: 1, borderColor: BORDER, borderRadius: 10, overflow: "hidden", marginTop: 12 },
  termsHead: { paddingHorizontal: 12, paddingTop: 11, paddingBottom: 8 },
  termsHeadTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: INK },
  termsHeadNote: { fontSize: 8.3, color: MUTED, marginTop: 3 },
  payRow: { flexDirection: "row", gap: 7, paddingHorizontal: 12, paddingBottom: 7 },
  payNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: NAVY,
    color: WHITE,
    fontSize: 8,
    textAlign: "center",
    paddingTop: 3.5,
  },
  payText: { flex: 1, fontSize: 9, color: BODY, lineHeight: 1.5 },
  cancelHeadRow: {
    flexDirection: "row",
    backgroundColor: BG_SUBTLE,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  cancelHeadText: { fontSize: 7.5, color: MUTED, letterSpacing: 0.4 },
  cancelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
  },
  cancelLabel: { flex: 1, fontSize: 9.5, color: INK },
  cancelCharge: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: ROSE, textAlign: "right" },

  // ── Why travel with us ───────────────────────────────────────────────────
  whyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  whyCard: {
    width: "48.5%",
    flexDirection: "row",
    gap: 9,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: BG_SUBTLE,
    padding: 11,
  },
  whyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  whyTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK },
  whyDesc: { fontSize: 8.2, color: MUTED, marginTop: 2, lineHeight: 1.4 },

  // ── Closing page ─────────────────────────────────────────────────────────
  closingTop: { backgroundColor: NAVY, borderRadius: 12, padding: 28, marginTop: 6 },
  closingKicker: { fontSize: 8.5, letterSpacing: 3, color: GOLD },
  closingHeadline: { fontSize: 22, color: WHITE, fontFamily: "Helvetica-Bold", marginTop: 12, lineHeight: 1.25 },
  stepsRow: { flexDirection: "row", marginTop: 22 },
  stepCol: { flex: 1, paddingRight: 12 },
  stepColMid: {
    flex: 1,
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(217,190,122,0.25)",
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GOLD,
    color: NAVY,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 5,
  },
  stepTitle: { fontSize: 10.5, color: WHITE, fontFamily: "Helvetica-Bold", marginTop: 9 },
  stepDesc: { fontSize: 8.5, color: SKY, marginTop: 4, lineHeight: 1.5 },
  contactCard: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  contactLogo: { width: 190, height: 52, objectFit: "contain" },
  contactAgency: { fontSize: 18, fontFamily: "Helvetica-Bold", color: NAVY },
  contactLabel: { fontSize: 8, letterSpacing: 2, color: MUTED, marginTop: 12 },
  contactLine: { fontSize: 11, color: INK, marginTop: 5 },
});

function fmtDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Agent logo (on a white badge) or, without one, the agency name as text. */
function AgentMark({ agent, variant }: { agent?: B2bAgentInfo | null; variant: "cover" | "header" }) {
  if (agent?.agencyLogoUrl) {
    return (
      <View style={variant === "cover" ? s.coverLogoChip : s.headerLogoChip}>
        <Image src={agent.agencyLogoUrl} style={variant === "cover" ? s.coverLogo : s.headerLogo} />
      </View>
    );
  }
  return (
    <Text style={variant === "cover" ? s.coverAgency : s.headerAgency}>
      {agent?.agencyName ?? "Travel Proposal"}
    </Text>
  );
}

function RunningHeader({
  agent,
  status,
  quoteRef,
  issued,
}: {
  agent?: B2bAgentInfo | null;
  status: ItineraryStatus;
  quoteRef: string;
  issued: string;
}) {
  return (
    <View style={s.header} fixed>
      <AgentMark agent={agent} variant="header" />
      <View style={s.headerRight}>
        <Text style={s.headerBadge}>{STATUS_LABEL[status]}</Text>
        <Text style={s.headerMeta}>
          Ref. {quoteRef} · Issued {issued}
        </Text>
      </View>
    </View>
  );
}

function PoweredBy({ vertexIcon, light = false }: { vertexIcon?: string | null; light?: boolean }) {
  return (
    <View style={s.poweredByRow}>
      {vertexIcon ? <Image src={vertexIcon} style={s.poweredByIcon} /> : null}
      <Text style={[s.poweredByText, light ? { color: SKY } : {}]}>
        Powered by Vertex Kashmir Holidays
      </Text>
    </View>
  );
}

function RunningFooter({
  agent,
  whiteLabel,
  vertexIcon,
}: {
  agent?: B2bAgentInfo | null;
  whiteLabel: boolean;
  vertexIcon?: string | null;
}) {
  const contactLine = [agent?.agencyName, agent?.phone, agent?.email].filter(Boolean).join("   ·   ");
  return (
    <View style={s.footer} fixed>
      <View>
        <Text style={s.footerText}>{contactLine}</Text>
        {!whiteLabel && <PoweredBy vertexIcon={vertexIcon} />}
      </View>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

function SectionHead({ title, tag }: { title: string; tag?: string }) {
  return (
    // Needs real room below it (~a card's height), so a heading never ends up
    // alone at the foot of a page with its content on the next one.
    <View style={s.secHeadRow} wrap={false} minPresenceAhead={160}>
      <Text style={s.secHead}>{title}</Text>
      {tag ? <Text style={s.secTag}>{tag.toUpperCase()}</Text> : null}
    </View>
  );
}

interface Props {
  data: ItineraryData;
  status: ItineraryStatus;
  /** Short, stable reference shown as "Ref." — derived from the itinerary id, not a separate stored field. */
  quoteRef: string;
  /** Issue timestamp, shown as "Issued". */
  updatedAt: string | Date;
  /** The travel company this proposal is for — brands the cover, header, footer, closing page and PDF metadata. */
  agent?: B2bAgentInfo | null;
  /** False until the agency has earned full white-label (see WHITE_LABEL_MIN_BOOKINGS) — adds a small "Powered by Vertex Kashmir Holidays" credit. */
  whiteLabel?: boolean;
  /** Vertex's small square icon mark, as a data: URI — only needed (and only fetched by the caller) when `whiteLabel` is false. */
  vertexIcon?: string | null;
}

export function B2bItineraryPdf({
  data,
  status,
  quoteRef,
  updatedAt,
  agent,
  whiteLabel = true,
  vertexIcon,
}: Props) {
  const issued = fmtDate(updatedAt);
  const isProposal = status !== "CONFIRMED";
  const hasTransport = !!(data.transportType || data.transportDesc);
  const contactLine = [agent?.phone, agent?.email].filter(Boolean).join("   ·   ");

  return (
    <Document
      title={`${isProposal ? "Travel Proposal" : "Itinerary"} - ${data.preparedFor}`}
      author={agent?.agencyName ?? undefined}
    >
      {/* ── COVER ─────────────────────────────────────────────────────────── */}
      <Page size="A4" style={[s.page, s.cover]}>
        <View style={s.coverContent}>
          <View style={s.coverBrandRow}>
            <AgentMark agent={agent} variant="cover" />
            <View style={s.coverRefBox}>
              <Text style={s.coverRefLabel}>{STATUS_LABEL[status]}</Text>
              <Text style={s.coverRefValue}>Ref. {quoteRef}</Text>
              <Text style={s.coverRefDate}>Issued {issued}</Text>
            </View>
          </View>

          <View style={s.coverTitleBlock}>
            <Text style={s.coverKicker}>YOUR JOURNEY · {data.duration}</Text>
            <Text style={s.coverTitle}>{data.coverTitle}</Text>
            {data.subtitle ? <Text style={s.coverSubtitle}>{data.subtitle}</Text> : null}
            <View style={s.coverDivider} />
            {data.destinations ? <Text style={s.coverDest}>{data.destinations}</Text> : null}
          </View>

          {data.preparedFor ? (
            <View style={s.coverPreparedFor}>
              <Text style={s.coverPreparedLabel}>PREPARED FOR</Text>
              <Text style={s.coverPreparedName}>{data.preparedFor}</Text>
            </View>
          ) : null}

          <View style={s.coverBottom}>
            <View style={s.coverStatRow}>
              <View style={s.coverStatCol}>
                <Text style={s.coverStatLabel}>TRAVEL DATES</Text>
                <Text style={s.coverStatValue}>{data.travelDates}</Text>
              </View>
              <View style={s.coverStatCol}>
                <Text style={s.coverStatLabel}>TRAVELLERS</Text>
                <Text style={s.coverStatValue}>{data.travelers}</Text>
              </View>
              <View style={[s.coverStatCol, { flex: 0.9 }]}>
                <Text style={s.coverStatLabel}>DURATION</Text>
                <Text style={s.coverStatValue}>{data.duration}</Text>
              </View>
            </View>

            {data.totalCost ? (
              <View style={s.coverPriceBox}>
                <View>
                  <Text style={s.coverPriceLabel}>TOTAL PACKAGE COST</Text>
                  <Text style={s.coverPriceNote}>For the full party · subject to availability</Text>
                </View>
                <Text style={s.coverPriceValue}>{data.totalCost}</Text>
              </View>
            ) : null}

            {isProposal && (
              <View style={s.coverNote} wrap={false}>
                <Text style={s.coverNoteTitle}>
                  PLEASE NOTE — THIS IS A PROPOSAL, NOT YOUR FINAL ITINERARY
                </Text>
                <Text style={s.coverNoteText}>
                  This proposal is shared to help you review and choose your trip; hotels, vehicles
                  and prices are indicative and subject to availability. Once you confirm with the
                  token payment, we will send your final detailed itinerary with confirmed hotels,
                  vehicle details, a day-by-day plan, inclusions and all booking information.
                </Text>
              </View>
            )}

            <View style={s.coverFooter}>
              <Text style={s.coverFooterText}>
                {[agent?.agencyName, agent?.phone, agent?.email].filter(Boolean).join("   ·   ")}
              </Text>
              {!whiteLabel && <PoweredBy vertexIcon={vertexIcon} light />}
            </View>
          </View>
        </View>
      </Page>

      {/* ── BODY — one continuous flowing page ────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <RunningHeader agent={agent} status={status} quoteRef={quoteRef} issued={issued} />
        <RunningFooter agent={agent} whiteLabel={whiteLabel} vertexIcon={vertexIcon} />
        <View style={s.body}>
          {data.days.length > 0 && (
            <>
              <SectionHead title="Your Journey, Day by Day" tag={data.duration} />
              <View style={s.table}>
                <View style={s.tHeadRow} wrap={false}>
                  <Text style={[s.tHeadCell, { width: 44 }]}>DAY</Text>
                  <Text style={[s.tHeadCell, { flex: 1 }]}>PLAN</Text>
                  <Text style={[s.tHeadCell, { width: 96 }]}>NIGHT STAY</Text>
                  <Text style={[s.tHeadCell, { width: 96 }]}>MEALS</Text>
                </View>
                {data.days.map((day, i) => {
                  const stay = day.meta.find((m) => m.label.trim().toLowerCase() === "stay");
                  const meals = day.meta.find((m) => m.label.trim().toLowerCase() === "meals");
                  return (
                    <View key={day.id} style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}]} wrap={false}>
                      <View style={[s.tCell, { width: 44 }]}>
                        <Text style={s.dayNum}>{String(i + 1).padStart(2, "0")}</Text>
                      </View>
                      <View style={[s.tCell, { flex: 1 }]}>
                        <Text style={s.tCellStrong}>{day.title}</Text>
                        {day.body ? <Text style={s.dayBody}>{day.body}</Text> : null}
                      </View>
                      <Text style={[s.tCell, { width: 96, fontFamily: "Helvetica-Bold", color: INK }]}>
                        {stay?.value || "—"}
                      </Text>
                      <Text style={[s.tCell, { width: 96 }]}>{meals?.value || "—"}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {data.hotels.length > 0 && (
            <View>
              <SectionHead title="Where You'll Stay" tag="Stay plan" />
              <View style={s.table}>
                <View style={s.tHeadRow}>
                  <Text style={[s.tHeadCell, { width: 104 }]}>DESTINATION</Text>
                  <Text style={[s.tHeadCell, { width: 52 }]}>NIGHTS</Text>
                  <Text style={[s.tHeadCell, { flex: 1 }]}>HOTEL</Text>
                  <Text style={[s.tHeadCell, { width: 88 }]}>ROOM TYPE</Text>
                  <Text style={[s.tHeadCell, { width: 50 }]}>ROOMS</Text>
                </View>
                {data.hotels.map((h, i) => (
                  <View key={h.id} style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}]} wrap={false}>
                    <Text style={[s.tCell, { width: 104, fontFamily: "Helvetica-Bold", color: INK }]}>
                      {h.destination}
                    </Text>
                    <Text style={[s.tCell, { width: 52 }]}>{h.nights}</Text>
                    <Text style={[s.tCell, { flex: 1 }]}>{h.hotelDetails}</Text>
                    <Text style={[s.tCell, { width: 88 }]}>{h.roomType}</Text>
                    <Text style={[s.tCell, { width: 50 }]}>{h.rooms}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.tableNote}>
                Hotels shown are proposed properties (or similar), subject to availability at the
                time of confirmation.
              </Text>
            </View>
          )}

          {hasTransport && (
            <View>
              <SectionHead title="Getting Around" tag="Transportation" />
              <View style={s.table}>
                <View style={s.tHeadRow}>
                  <Text style={[s.tHeadCell, { width: 150 }]}>VEHICLE</Text>
                  <Text style={[s.tHeadCell, { flex: 1 }]}>DETAILS</Text>
                </View>
                <View style={s.tRow}>
                  <Text style={[s.tCell, { width: 150, fontFamily: "Helvetica-Bold", color: INK }]}>
                    {data.transportType || "—"}
                  </Text>
                  <Text style={[s.tCell, { flex: 1 }]}>{data.transportDesc || "—"}</Text>
                </View>
              </View>
            </View>
          )}

          {data.activities.length > 0 && (
            <View>
              <SectionHead title="Included Activities" tag="Part of your package" />
              <View style={s.actGrid}>
                {data.activities.map((a) => (
                  <View key={a.id} style={s.actCard} wrap={false}>
                    <View style={s.actIcon}>
                      <PdfIcon icon="highlights" size={14} color={GREEN} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.actName}>{a.name}</Text>
                      <Text style={s.actMeta}>{[a.place, a.time].filter(Boolean).join(" · ")}</Text>
                      <View style={s.actTags}>
                        <Text style={s.actTagIncluded}>INCLUDED</Text>
                        {a.day ? <Text style={s.actTagDay}>{a.day.toUpperCase()}</Text> : null}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {data.totalCost ? (
            <View style={s.priceCard} wrap={false}>
              <View>
                <Text style={s.priceLabel}>TOTAL PACKAGE COST</Text>
                <Text style={s.priceCaption}>
                  For the full party · final amount confirmed at booking
                </Text>
              </View>
              <Text style={s.priceValue}>{data.totalCost}</Text>
            </View>
          ) : null}

          {(data.inc.length > 0 || data.exc.length > 0) && (
            <View>
              <SectionHead title="What's Covered" tag="Inclusions & exclusions" />
              <View style={s.twoCol} wrap={false}>
                {data.inc.length > 0 && (
                  <View style={[s.coveredCard, { borderColor: "#cfe3d6" }]}>
                    <View style={[s.coveredHead, { backgroundColor: GREEN }]}>
                      <PdfIcon icon="check" size={11} color={WHITE} />
                      <Text style={s.coveredHeadText}>Included</Text>
                    </View>
                    <View style={s.coveredBody}>
                      {data.inc.map((item) => (
                        <View key={item.id} style={s.coveredRow}>
                          <PdfIcon icon="check" size={9} color={GREEN} />
                          <Text style={s.coveredText}>{item.text}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {data.exc.length > 0 && (
                  <View style={[s.coveredCard, { borderColor: "#f1cfd7" }]}>
                    <View style={[s.coveredHead, { backgroundColor: ROSE }]}>
                      <PdfIcon icon="minus" size={11} color={WHITE} />
                      <Text style={s.coveredHeadText}>Not Included</Text>
                    </View>
                    <View style={[s.coveredBody, { backgroundColor: ROSE_LIGHT }]}>
                      {data.exc.map((item) => (
                        <View key={item.id} style={s.coveredRow}>
                          <PdfIcon icon="minus" size={9} color={ROSE} />
                          <Text style={s.coveredText}>{item.text}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {(data.pay.length > 0 || data.cancel.length > 0) && (
            <View>
              <SectionHead title="Payment & Cancellation" tag="Terms & policies" />
              {data.pay.length > 0 && (
                <View style={[s.termsCard, { marginTop: 0 }]} wrap={false}>
                  <View style={s.termsHead}>
                    <Text style={s.termsHeadTitle}>Payment terms</Text>
                  </View>
                  {data.pay.map((item, i) => (
                    <View key={i} style={s.payRow}>
                      <Text style={s.payNum}>{i + 1}</Text>
                      <Text style={s.payText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
              {data.cancel.length > 0 && (
                <View style={s.termsCard}>
                  <View style={s.termsHead}>
                    <Text style={s.termsHeadTitle}>Cancellation policy</Text>
                    <Text style={s.termsHeadNote}>Notice is counted from your first travel date.</Text>
                  </View>
                  <View style={s.cancelHeadRow}>
                    <Text style={[s.cancelHeadText, { flex: 1 }]}>WHEN YOU CANCEL</Text>
                    <Text style={s.cancelHeadText}>CHARGE</Text>
                  </View>
                  {data.cancel.map((c) => (
                    <View key={c.id} style={s.cancelRow} wrap={false}>
                      <Text style={s.cancelLabel}>{c.label}</Text>
                      {c.charge ? <Text style={s.cancelCharge}>{c.charge}</Text> : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {data.whyChoose.length > 0 && (
            <View>
              <SectionHead title="Why Travel With Us" />
              <View style={s.whyGrid}>
                {data.whyChoose.map((w) => (
                  <View key={w.id} style={s.whyCard} wrap={false}>
                    <View style={s.whyIcon}>
                      <PdfIcon icon={w.icon} size={13} color={NAVY} solid />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.whyTitle}>{w.title}</Text>
                      <Text style={s.whyDesc}>{w.subtitle}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Page>

      {/* ── CLOSING ───────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <RunningHeader agent={agent} status={status} quoteRef={quoteRef} issued={issued} />
        <RunningFooter agent={agent} whiteLabel={whiteLabel} vertexIcon={vertexIcon} />
        <View style={s.body}>
          <View style={s.closingTop} wrap={false}>
            <Text style={s.closingKicker}>{isProposal ? "READY WHEN YOU ARE" : "YOU'RE ALL SET"}</Text>
            <Text style={s.closingHeadline}>
              {isProposal
                ? "Happy to adjust anything — hotels, route or budget."
                : "Your trip is confirmed — we look forward to hosting you."}
            </Text>
            {isProposal && (
              <View style={s.stepsRow}>
                <View style={s.stepCol}>
                  <Text style={s.stepBadge}>1</Text>
                  <Text style={s.stepTitle}>Review & tell us</Text>
                  <Text style={s.stepDesc}>
                    Share any changes to dates, hotels or the route — we&apos;ll update the plan.
                  </Text>
                </View>
                <View style={s.stepColMid}>
                  <Text style={s.stepBadge}>2</Text>
                  <Text style={s.stepTitle}>Confirm your trip</Text>
                  <Text style={s.stepDesc}>
                    Pay the token amount to lock in your hotels and vehicle.
                  </Text>
                </View>
                <View style={[s.stepColMid, { paddingRight: 0 }]}>
                  <Text style={s.stepBadge}>3</Text>
                  <Text style={s.stepTitle}>Get your final itinerary</Text>
                  <Text style={s.stepDesc}>
                    We send the detailed itinerary with all confirmed bookings.
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={s.contactCard} wrap={false}>
            {agent?.agencyLogoUrl ? (
              <Image src={agent.agencyLogoUrl} style={s.contactLogo} />
            ) : (
              <Text style={s.contactAgency}>{agent?.agencyName ?? ""}</Text>
            )}
            {contactLine ? (
              <>
                <Text style={s.contactLabel}>GET IN TOUCH</Text>
                <Text style={s.contactLine}>{contactLine}</Text>
              </>
            ) : null}
            {!whiteLabel && (
              <View style={{ marginTop: 12 }}>
                <PoweredBy vertexIcon={vertexIcon} />
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
