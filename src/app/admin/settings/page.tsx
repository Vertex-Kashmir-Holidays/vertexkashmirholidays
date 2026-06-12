import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";

export const metadata: Metadata = { title: "Settings — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-brand-navy text-xl">Site Settings</h2>
        <p className="text-gray-400 text-xs mt-0.5">Configure site-wide settings, social links, and default SEO</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
