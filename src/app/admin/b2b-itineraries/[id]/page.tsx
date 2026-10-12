import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { B2bItineraryEditor } from "@/components/admin/itinerary/B2bItineraryEditor";
import { genId, itineraryDataSchema, type ItineraryData } from "@/types/itinerary";
import { DEFAULT_ITINERARY_DATA } from "@/components/admin/itinerary/default-data";
import { getPdfTrustContent, toItineraryWhyChoose } from "@/lib/itinerary/pdfTrustContent";
import { isB2bAgentWhiteLabelEligible } from "@/lib/b2b/whiteLabelEligibility";
import { resolveB2bItineraryAccess } from "@/lib/itinerary/access";

export const metadata: Metadata = { title: "Edit B2B Itinerary — Admin" };
export const dynamic = "force-dynamic";

// Deliberately its own page (not /admin/itinerary/[id]) — that page's access
// resolution is assignee-gated (see resolveItineraryAccess), which B2B
// requests have no concept of. Any staff with itinerary permission may edit
// any B2B itinerary — see .../api/admin/b2b-itineraries/[id].
export default async function EditB2bItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "itinerary", "view"))) {
    redirect("/admin/b2b-requests");
  }

  const { id } = await params;
  const record = await prisma.itinerary.findUnique({
    where: { id },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          b2bAgentId: true,
          locked: true,
          status: true,
          bookingId: true,
          b2bAgent: { select: { agencyName: true, agencyLogoUrl: true, phone: true, email: true } },
        },
      },
    },
  });
  if (!record || record.lead?.b2bAgentId == null) notFound();

  const parsed = itineraryDataSchema.safeParse(record.data);
  let data: ItineraryData = parsed.success ? parsed.data : DEFAULT_ITINERARY_DATA;

  // Converted → locked with its booking; an admin may edit again while the
  // booking is unlocked for changes (resolveB2bItineraryAccess — the save API
  // enforces the same rule).
  const access = resolveB2bItineraryAccess(
    { locked: record.locked, lead: record.lead },
    { role, canEditItineraries: await can(role, "itinerary", "edit") },
  );
  const canSave = access.canEdit;

  // Same backfills as the normal itinerary editor page — itineraries saved
  // before these fields existed parse them as `[]`. Not written back until
  // the next explicit Save.
  const trustContent = await getPdfTrustContent();
  if (data.whyChoose.length === 0 && trustContent.whyChoose.length > 0) {
    data = { ...data, whyChoose: toItineraryWhyChoose(trustContent.whyChoose) };
  }
  if (data.activities.length === 0) {
    data = {
      ...data,
      activities: DEFAULT_ITINERARY_DATA.activities.map((a) => ({ ...a, id: genId("act") })),
    };
  }

  const whiteLabel = await isB2bAgentWhiteLabelEligible(record.lead.b2bAgentId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <Link
          href={`/admin/b2b-requests/${record.lead.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to B2B request: {record.lead.name}
        </Link>
      </div>
      {access.converted && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            access.locked
              ? "border-border bg-muted text-muted-foreground"
              : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {access.locked ? (
            <>
              This request is converted — its itinerary is{" "}
              <strong className="text-foreground">locked</strong> with the booking and is
              view-only. An admin can use &ldquo;Unlock for changes&rdquo; on{" "}
            </>
          ) : access.canEdit ? (
            <>
              <strong>Unlocked for corrections.</strong> Save your changes, then re-lock the
              services on{" "}
            </>
          ) : (
            <>Unlocked for corrections — only an admin can edit it. See </>
          )}
          {record.lead.bookingId ? (
            <Link
              href={`/admin/bookings/${record.lead.bookingId}/services`}
              className="font-semibold underline underline-offset-2"
            >
              the booking
            </Link>
          ) : (
            "the booking"
          )}
          {access.locked ? " to edit it." : "."}
        </p>
      )}
      <B2bItineraryEditor
        id={record.id}
        initialData={data}
        initialTitle={record.title}
        initialStatus={record.status}
        canSave={canSave}
        apiBasePath="/api/admin/b2b-itineraries"
        agent={record.lead.b2bAgent}
        whiteLabel={whiteLabel}
      />
    </div>
  );
}
