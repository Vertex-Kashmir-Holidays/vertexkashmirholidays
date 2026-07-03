import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { BannerList } from "@/components/admin/banners/BannerList";

export const metadata: Metadata = { title: "Banners — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "banners", "view"))) redirect("/admin/dashboard");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    can(role, "banners", "create"),
    can(role, "banners", "edit"),
    can(role, "banners", "delete"),
  ]);

  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold text-foreground">Banners</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Promotional strips (above the navbar) and inline promo cards across the public site.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/banners/new"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-0 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> New Banner
          </Link>
        )}
      </div>
      <BannerList
        items={banners.map((b) => ({
          id: b.id,
          type: b.type,
          title: b.title,
          pages: b.pages,
          isActive: b.isActive,
          sortOrder: b.sortOrder,
          startsAt: b.startsAt ? b.startsAt.toISOString() : null,
          endsAt: b.endsAt ? b.endsAt.toISOString() : null,
        }))}
        canEdit={canEdit}
        canDelete={canDelete}
        canCreate={canCreate}
      />
    </div>
  );
}
