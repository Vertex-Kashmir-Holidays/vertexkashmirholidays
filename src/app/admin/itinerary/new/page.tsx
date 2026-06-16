import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ItineraryEditor } from "@/components/admin/itinerary/ItineraryEditor";
import { DEFAULT_ITINERARY_DATA } from "@/components/admin/itinerary/default-data";

export const metadata: Metadata = { title: "New Itinerary — Admin" };
export const dynamic = "force-dynamic";

export default async function NewItineraryPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "itinerary", "create"))) {
    redirect("/admin/itinerary");
  }

  return (
    <ItineraryEditor
      initialData={DEFAULT_ITINERARY_DATA}
      initialTitle="Kashmir Escape Itinerary"
      initialStatus="DRAFT"
      canSave
    />
  );
}
