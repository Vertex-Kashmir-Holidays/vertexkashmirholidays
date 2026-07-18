import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { BannerForm } from "@/components/admin/banners/BannerForm";

export const metadata: Metadata = { title: "New Banner — Admin" };
export const dynamic = "force-dynamic";

export default async function NewBannerPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "banners", "create"))) redirect("/admin/banners");

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/banners"
          className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" /> All Banners
        </Link>
        <h2 className="font-display text-xl font-extrabold text-foreground">New Banner</h2>
      </div>
      <BannerForm initial={null} canEdit />
    </div>
  );
}
