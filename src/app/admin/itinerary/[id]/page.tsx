import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ItineraryEditor } from "@/components/admin/itinerary/ItineraryEditor";
import { itineraryDataSchema, type ItineraryData } from "@/types/itinerary";
import { DEFAULT_ITINERARY_DATA } from "@/components/admin/itinerary/default-data";

export const metadata: Metadata = { title: "Edit Itinerary — Admin" };
export const dynamic = "force-dynamic";

export default async function EditItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "itinerary", "view"))) {
    redirect("/admin/itinerary");
  }

  const { id } = await params;
  const record = await prisma.itinerary.findUnique({ where: { id } });
  if (!record) notFound();

  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";
  if (record.ownerId !== session!.user.id && !isAdmin) {
    redirect("/admin/itinerary");
  }

  // Tolerate older/partial payloads by falling back to defaults for missing keys.
  const parsed = itineraryDataSchema.safeParse(record.data);
  const data: ItineraryData = parsed.success ? parsed.data : DEFAULT_ITINERARY_DATA;

  const canEdit = await can(role, "itinerary", "edit");

  return (
    <ItineraryEditor
      id={record.id}
      initialData={data}
      initialTitle={record.title}
      initialStatus={record.status}
      canSave={canEdit}
    />
  );
}
