import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FIELD_DEFS } from "@/lib/admin/pageFields";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";
import { FlushCacheButton } from "@/components/admin/settings/FlushCacheButton";
import { ListEditor } from "@/components/admin/pages/ListEditor";

export const metadata: Metadata = { title: "Settings — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  const role = session?.user?.role;

  const [settings, corporateOffices, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    }),
    // Corporate Office(s) — same "contact" resource/permission the Contact
    // Page editor's Offices list used, just managed from here alongside the
    // Registered Office fields so address data lives in one place.
    prisma.contactOffice.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    role ? can(role, "contact", "create") : false,
    role ? can(role, "contact", "edit") : false,
    role ? can(role, "contact", "delete") : false,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Site Settings</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Configure site-wide settings, social links, and default SEO
          </p>
        </div>
        <FlushCacheButton />
      </div>
      <SettingsForm settings={settings} />
      <ListEditor
        title="Corporate Office(s)"
        description="Shown on the footer, contact page, SEO listing and generated documents. The first office is the primary one — additional offices appear as 'Other Offices' on the Contact page."
        resource="contactOffices"
        fields={FIELD_DEFS.contactOffices}
        items={corporateOffices}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
