// Booking-token Razorpay Payment Link for the itinerary PDF's "Scan to pay" QR.
//
// Business rules (see the itinerary-token-qr feature spec):
//   - Fixed token amount: ₹2,000, or the tour/package total if that's lower.
//     accept_partial=false — the customer can never pay a different amount.
//   - One CURRENT active link per itinerary. Reused as-is for 48h from creation.
//   - Past 48h (and not yet paid): the old link is cancelled and a new one is
//     minted. Already-PAID links are never superseded, regardless of age.
//   - This is a payment-COLLECTION mechanism only. It never touches Booking
//     status, Lead status, or BookingPayment — staff record/confirm the token
//     manually through the existing convert/payments flow, unchanged.
//   - Amount is always computed server-side from Lead.negotiatedAmount /
//     Booking.amount — never from client input or free-text PDF content.
import { prisma } from "@/lib/prisma";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { round2 } from "@/lib/bookings/finance";
import { logPaymentAudit } from "@/lib/bookings/audit";

export const TOKEN_STANDARD_AMOUNT_RUPEES = 2000;
const LINK_VALIDITY_MS = 48 * 60 * 60 * 1000;

export interface TokenPaymentLinkResult {
  shortUrl: string;
  amountRupees: number;
}

type ResolveOutcome = TokenPaymentLinkResult | { error: string };

/**
 * Resolve (reuse, or create/replace) the single current token Payment Link for
 * an itinerary, and return its short URL + amount for the caller to turn into a
 * QR and PDF caption. Idempotent and safe under concurrent calls (row-locked).
 */
export async function resolveTokenPaymentLink(itineraryId: string): Promise<ResolveOutcome> {
  if (!isRazorpayConfigured()) {
    return { error: "Razorpay is not configured." };
  }

  // Row-locked for the whole operation (including the Razorpay API calls) so two
  // near-simultaneous PDF downloads for the same itinerary can't each mint their
  // own Payment Link — the second request blocks until the first has committed
  // its result, then simply reads it back. This repo's low request volume for
  // this action (a staff/customer clicking "Download PDF") makes holding the
  // lock across a ~1-2s external HTTP call an acceptable, standard trade-off —
  // see .ai/instructions/coding-standards.md for the alternative (optimistic
  // findFirst-then-create) pattern used elsewhere for higher-volume paths.
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Itinerary" WHERE id = ${itineraryId} FOR UPDATE`;

      const itinerary = await tx.itinerary.findUnique({
        where: { id: itineraryId },
        select: {
          id: true,
          leadId: true,
          bookingId: true,
          lead: { select: { name: true, phone: true, email: true, negotiatedAmount: true } },
          booking: {
            select: { guestName: true, guestPhone: true, guestEmail: true, amount: true },
          },
          razorpayPaymentLinkId: true,
          razorpayPaymentLinkUrl: true,
          razorpayPaymentLinkAmount: true,
          razorpayPaymentLinkSeq: true,
          razorpayPaymentLinkCreatedAt: true,
        },
      });
      if (!itinerary) return { error: "Itinerary not found." };

      // Authoritative total: Booking.amount post-conversion, else the lead's
      // negotiated amount (kept in sync from the itinerary's own total-cost
      // field on every save — see parseProposedAmount in
      // src/app/api/itineraries/[id]/route.ts). Never parsed from PDF content
      // here directly, and never trusted from any client input.
      const total = itinerary.booking?.amount ?? itinerary.lead?.negotiatedAmount ?? null;
      const amountRupees =
        total != null && total > 0 && total < TOKEN_STANDARD_AMOUNT_RUPEES
          ? round2(total)
          : TOKEN_STANDARD_AMOUNT_RUPEES;
      const amountPaise = Math.round(amountRupees * 100);

      const razorpay = getRazorpayClient();

      // ── Existing link present — decide reuse / supersede / already-paid ──
      if (itinerary.razorpayPaymentLinkId && itinerary.razorpayPaymentLinkUrl) {
        // Typed manually (not via ReturnType<typeof razorpay.paymentLink.fetch>):
        // that method is overloaded with a callback variant, so ReturnType picks
        // the last (void-returning) overload rather than the Promise one.
        let live: { status: "created" | "partially_paid" | "expired" | "cancelled" | "paid" } | null = null;
        try {
          live = await razorpay.paymentLink.fetch(itinerary.razorpayPaymentLinkId);
        } catch (err) {
          console.error("[tokenPaymentLink] failed to fetch live status:", itinerary.razorpayPaymentLinkId, err);
        }

        if (live) {
          // CASE 3 — already paid: never supersede, regardless of age.
          if (live.status === "paid" || live.status === "partially_paid") {
            return {
              shortUrl: itinerary.razorpayPaymentLinkUrl,
              amountRupees: (itinerary.razorpayPaymentLinkAmount ?? amountPaise) / 100,
            };
          }
          // CASE 1 — Razorpay confirms it's still open AND we're inside the
          // local 48h window (belt-and-suspenders alongside expire_by).
          const ageMs = itinerary.razorpayPaymentLinkCreatedAt
            ? Date.now() - itinerary.razorpayPaymentLinkCreatedAt.getTime()
            : Infinity;
          if (live.status === "created" && ageMs < LINK_VALIDITY_MS) {
            return {
              shortUrl: itinerary.razorpayPaymentLinkUrl,
              amountRupees: (itinerary.razorpayPaymentLinkAmount ?? amountPaise) / 100,
            };
          }
          // CASE 2 — expired/cancelled, or past our 48h business window while
          // still technically open on Razorpay's side: best-effort cancel, then
          // fall through to mint a new one below.
          if (live.status === "created") {
            try {
              await razorpay.paymentLink.cancel(itinerary.razorpayPaymentLinkId);
            } catch (err) {
              console.error("[tokenPaymentLink] failed to cancel superseded link:", itinerary.razorpayPaymentLinkId, err);
            }
          }
        } else {
          // Couldn't confirm the authoritative state (Razorpay unreachable) —
          // don't guess. Reuse the cached link if it's still within the local
          // 48h window; otherwise refuse rather than risk creating a duplicate
          // for (or silently superseding) a link that may already be paid.
          const ageMs = itinerary.razorpayPaymentLinkCreatedAt
            ? Date.now() - itinerary.razorpayPaymentLinkCreatedAt.getTime()
            : Infinity;
          if (ageMs < LINK_VALIDITY_MS) {
            return {
              shortUrl: itinerary.razorpayPaymentLinkUrl,
              amountRupees: (itinerary.razorpayPaymentLinkAmount ?? amountPaise) / 100,
            };
          }
          return { error: "Could not verify the existing payment link's status. Please try again shortly." };
        }
      }

      // ── Mint a new link ──
      const name = itinerary.booking?.guestName || itinerary.lead?.name || "Guest";
      const phone = itinerary.booking?.guestPhone || itinerary.lead?.phone || "";
      const email = itinerary.booking?.guestEmail || itinerary.lead?.email || undefined;
      const seq = itinerary.razorpayPaymentLinkSeq + 1;
      const refId = `VTX-${shortRef(itinerary.id)}-TOKEN-${String(seq).padStart(3, "0")}`;

      const notes: Record<string, string> = { itineraryId: itinerary.id };
      if (itinerary.leadId) notes.leadId = itinerary.leadId;
      if (itinerary.bookingId) notes.bookingId = itinerary.bookingId;

      let link;
      try {
        link = await razorpay.paymentLink.create({
          amount: amountPaise,
          currency: "INR",
          accept_partial: false,
          reference_id: refId,
          description: "Booking token payment — Vertex Kashmir Holidays",
          customer: { name, contact: phone, email },
          notes,
          // We control distribution entirely via the PDF — Razorpay must not
          // independently SMS/email/WhatsApp the customer on creation.
          notify: { sms: false, email: false, whatsapp: false },
          expire_by: Math.floor((Date.now() + LINK_VALIDITY_MS) / 1000),
        });
      } catch (err) {
        console.error("[tokenPaymentLink] Razorpay create failed:", err);
        return { error: "Could not create the payment link." };
      }

      await tx.itinerary.update({
        where: { id: itineraryId },
        data: {
          razorpayPaymentLinkId: link.id,
          razorpayPaymentLinkRefId: refId,
          razorpayPaymentLinkUrl: link.short_url,
          razorpayPaymentLinkAmount: amountPaise,
          razorpayPaymentLinkSeq: seq,
          razorpayPaymentLinkCreatedAt: new Date(),
        },
      });

      await logPaymentAudit({
        event: "TOKEN_LINK_CREATED",
        bookingId: itinerary.bookingId ?? null,
        orderId: link.id,
        amount: amountRupees,
        detail: `itinerary=${itinerary.id} ref=${refId}`,
      });

      return { shortUrl: link.short_url, amountRupees };
    },
    { timeout: 20000, maxWait: 5000 },
  );
}

/** Last 8 chars of a cuid, uppercased — short, stable, human-scannable reference suffix. */
function shortRef(id: string): string {
  return id.slice(-8).toUpperCase();
}
