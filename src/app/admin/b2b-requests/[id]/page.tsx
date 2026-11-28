import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileEdit, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";
import { parseGstRates } from "@/lib/payments/gst";
import { resolveB2bItineraryAccess } from "@/lib/itinerary/access";
import { CreateB2bItineraryButton } from "@/components/admin/b2b/CreateB2bItineraryButton";
import { ManualItineraryCard } from "@/components/admin/leads/ManualItineraryCard";
import { itineraryDataSchema } from "@/types/itinerary";
import { parseHotelChoices } from "@/lib/proposal/hotelChoices";
import { B2bConvertAction } from "@/components/admin/b2b/B2bConvertAction";
import { EditB2bRequestButton } from "@/components/admin/b2b/EditB2bRequestButton";
import { DeleteB2bRequestButton } from "@/components/b2b/DeleteB2bRequestButton";
import { FollowUpB2bRequestButton } from "@/components/admin/b2b/FollowUpB2bRequestButton";
import {
  CloseB2bRequestButton,
  ReopenB2bRequestButton,
} from "@/components/admin/b2b/CloseB2bRequestButton";
import {
  b2bClosedCount,
  b2bClosedEditableUntil,
  b2bRequestClosedAt,
  canAdminUpdateClosed,
} from "@/lib/b2b/close";
import {
  B2B_CLOSE_LIMIT,
  B2B_STATUS_LABELS as STATUS_LABELS,
  isItinerarySent,
  type B2bRequestStatus,
} from "@/lib/b2b/requestStatus";

export const metadata: Metadata = { title: "B2B Request — Admin" };
export const dynamic = "force-dynamic";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminB2bRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "b2bRequests", "view"))) {
    redirect("/admin/b2b-requests");
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      adults: true,
      children: true,
      days: true,
      rooms: true,
      budget: true,
      startDate: true,
      endDate: true,
      notes: true,
      status: true,
      createdById: true,
      createdAt: true,
      b2bAgentId: true,
      bookingId: true,
      b2bAgent: { select: { id: true, name: true, email: true, agencyName: true } },
      locked: true,
      itinerary: {
        select: { id: true, status: true, updatedAt: true, locked: true, publishedAt: true, data: true },
      },
      booking: { select: { servicesLocked: true } },
      manualItineraryUrl: true,
      manualItineraryName: true,
      manualItineraryAt: true,
      itineraryArtifactUrl: true,
    },
  });
  if (!lead || lead.b2bAgentId === null) notFound();

  const canManageItinerary = await can(role, "itinerary", "create");
  // Stays offering several hotels — the convert dialog asks which was confirmed.
  const parsedItinerary = lead.itinerary ? itineraryDataSchema.safeParse(lead.itinerary.data) : null;
  const hotelStays = (parsedItinerary?.success ? parsedItinerary.data.hotels : [])
    .map((h) => ({ id: h.id, destination: h.destination, choices: parseHotelChoices(h.hotelDetails).choices }))
    .filter((h) => h.choices.length > 1);
  const canConvert = await can(role, "b2bRequests", "edit");
  // Same rules as PATCH /api/admin/b2b-requests/[id]: frozen once converted;
  // a closed request is open to admins for 2 months after closing.
  const isClosed = lead.status === "REJECTED";
  const closedAt = isClosed ? await b2bRequestClosedAt(lead.id) : null;
  const closeReason = isClosed
    ? (
        await prisma.leadActivity.findFirst({
          where: { leadId: lead.id, type: "STATUS_CHANGE", toStatus: "REJECTED" },
          orderBy: { performedAt: "desc" },
          select: { note: true, performedByName: true },
        })
      )
    : null;
  const canUpdateClosed = isClosed && canConvert && canAdminUpdateClosed(role, closedAt);
  const canEditRequest =
    canConvert && lead.status !== "CONVERTED" && !lead.locked && (!isClosed || canUpdateClosed);
  // Same rules as DELETE /api/admin/b2b-requests/[id].
  const canDelete =
    lead.status !== "CONVERTED" &&
    !lead.locked &&
    (await can(role, "b2bRequests", "delete")) &&
    (!isClosed || canAdminUpdateClosed(role, closedAt));
  const canClose = canConvert && !isClosed && lead.status !== "CONVERTED" && !lead.locked;
  // Closed requests the agent already has — same count as the close route.
  const closedCount = canClose && lead.b2bAgentId ? await b2bClosedCount(lead.b2bAgentId) : 0;
  // Follow-up emails about this request (B2B Communication, tagged request).
  const canFollowUp = lead.status !== "CONVERTED" && (await can(role, "b2bAgents", "edit"));
  const followUps = await prisma.b2bMessage.findMany({
    where: { requestId: lead.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, subject: true, sentByName: true, createdAt: true, sent: true },
  });
  const ymd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  // Matches the convert route: "sent" = published to the agent.
  const itinerarySent = isItinerarySent(lead.itinerary?.status) && !!lead.itinerary?.publishedAt;
  // Converted → locked while the booking's services are (resolveB2bItineraryAccess).
  const itineraryLocked = lead.itinerary
    ? resolveB2bItineraryAccess(
        { locked: lead.itinerary.locked, lead },
        { role, canEditItineraries: canManageItinerary },
      ).locked
    : lead.locked;
  const settings = canConvert ? await getSiteSettings() : null;
  const gstRates = parseGstRates(settings?.gstRates);

  return (
    <div className="space-y-5">
      <Link
        href="/admin/b2b-requests"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to B2B Requests
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
            {lead.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.b2bAgent?.agencyName ?? lead.b2bAgent?.name} · {lead.b2bAgent?.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEditRequest && (
            <EditB2bRequestButton
              requestId={lead.id}
              initial={{
                guestName: lead.name,
                guestPhone: lead.phone,
                days: lead.days?.toString() ?? "",
                pax: lead.adults.toString(),
                children: lead.children?.toString() ?? "",
                rooms: lead.rooms?.toString() ?? "",
                budget: lead.budget?.toString() ?? "",
                startDate: ymd(lead.startDate),
                endDate: ymd(lead.endDate),
                notes: lead.notes ?? "",
              }}
            />
          )}
          {canClose && (
            <CloseB2bRequestButton
              requestId={lead.id}
              agencyName={lead.b2bAgent?.agencyName ?? lead.b2bAgent?.name ?? "This agent"}
              closedCount={closedCount}
              limit={B2B_CLOSE_LIMIT}
            />
          )}
          {canUpdateClosed && <ReopenB2bRequestButton requestId={lead.id} />}
          {canDelete && (
            <DeleteB2bRequestButton endpoint={`/api/admin/b2b-requests/${lead.id}`} redirectTo="/admin/b2b-requests" />
          )}
          {canFollowUp && (
            <FollowUpB2bRequestButton
              request={{
                id: lead.id,
                label: `${lead.name} · sent ${fmtDate(lead.createdAt)}`,
                agentLabel: lead.b2bAgent?.agencyName ?? lead.b2bAgent?.name ?? "the agent",
              }}
            />
          )}
          <span className="inline-flex rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
            {STATUS_LABELS[lead.status as B2bRequestStatus] ?? lead.status}
          </span>
        </div>
      </div>

      {isClosed && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
          <p className="font-bold text-red-700 dark:text-red-300">
            Closed {fmtDate(closedAt)}
            {closeReason?.performedByName ? ` by ${closeReason.performedByName}` : ""}
          </p>
          {closeReason?.note && <p className="mt-1 whitespace-pre-wrap text-foreground">{closeReason.note}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {canAdminUpdateClosed("ADMIN", closedAt)
              ? `Admins can update or reopen it until ${fmtDate(b2bClosedEditableUntil(closedAt))}.`
              : "The 2-month window to update or reopen it has passed."}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Guest</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{lead.name}</p>
          <p className="text-sm text-muted-foreground">{lead.phone}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Trip</p>
          <p className="mt-1 text-sm text-foreground">
            {lead.days ? `${lead.days} days` : "Days not specified"} · {lead.adults}
            {lead.children ? ` + ${lead.children} children` : ""} pax
            {lead.rooms ? ` · ${lead.rooms} rooms` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {fmtDate(lead.startDate)} — {fmtDate(lead.endDate)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Budget</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {lead.budget ? inr.format(lead.budget) : "Not specified"}
          </p>
        </div>
        {lead.notes && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Other Requirements
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{lead.notes}</p>
          </div>
        )}
      </div>

      {followUps.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Follow-ups sent</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {followUps.map((f) => (
              <li key={f.id} className="flex flex-wrap justify-between gap-2">
                <span className="font-semibold text-foreground">
                  {f.subject}
                  {f.sent === 0 && <span className="ml-2 text-xs font-bold text-red-600">not delivered</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmtDate(f.createdAt)} · {f.sentByName}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Itinerary</h2>
        {lead.itinerary ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Status: <span className="font-semibold text-foreground">{lead.itinerary.status}</span>{" "}
              · Last updated {fmtDate(lead.itinerary.updatedAt)}
            </p>
            {canManageItinerary && (
              <Link
                href={`/admin/b2b-itineraries/${lead.itinerary.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                <FileEdit className="h-4 w-4" />
                {itineraryLocked ? "View Itinerary" : "Edit Itinerary"}
              </Link>
            )}
          </div>
        ) : canManageItinerary ? (
          <div className="mt-3">
            <p className="mb-3 text-sm text-muted-foreground">
              No itinerary yet — this request stays Pending until one is generated.
            </p>
            <CreateB2bItineraryButton leadId={lead.id} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No itinerary yet.</p>
        )}
        <div className="mt-4">
          <ManualItineraryCard
            leadId={lead.id}
            audience="agent"
            canEdit={canConvert}
            initial={{
              url: lead.manualItineraryUrl,
              name: lead.manualItineraryName,
              uploadedAt: lead.manualItineraryAt?.toISOString() ?? null,
              artifactUrl: lead.itineraryArtifactUrl,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Booking</h2>
        {lead.bookingId ? (
          <div className="mt-3">
            <Link
              href={`/admin/bookings/${lead.bookingId}/services`}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" />
              View Booking
            </Link>
          </div>
        ) : isClosed ? (
          <p className="mt-3 text-sm text-muted-foreground">Request closed — reopen it to convert.</p>
        ) : canConvert ? (
          <div className="mt-3">
            <p className="mb-3 text-sm text-muted-foreground">
              {!lead.itinerary
                ? "Generate an itinerary before this request can be converted."
                : itinerarySent
                  ? "Ready to convert once amounts are confirmed with the agent."
                  : "Publish the itinerary to the agent (Publish button in the itinerary editor) before this request can be converted."}
            </p>
            <B2bConvertAction
              leadId={lead.id}
              guestName={lead.name}
              gstRates={gstRates}
              itinerarySent={itinerarySent}
              initialStartDate={lead.startDate?.toISOString().slice(0, 10) ?? ""}
              initialEndDate={lead.endDate?.toISOString().slice(0, 10) ?? ""}
              hotelStays={hotelStays}
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Not converted yet.</p>
        )}
      </div>
    </div>
  );
}
