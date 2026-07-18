import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { BannerForm } from "@/components/admin/banners/BannerForm";

export const metadata: Metadata = { title: "Edit Banner — Admin" };
export const dynamic = "force-dynamic";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "banners", "view"))) redirect("/admin/dashboard");

  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  const canEdit = await can(role, "banners", "edit");

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/banners"
          className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" /> All Banners
        </Link>
        <h2 className="font-display text-xl font-extrabold text-foreground">
          Edit: {banner.title}
        </h2>
        {!canEdit && (
          <p className="text-xs text-amber-600 dark:text-amber-400">You have read-only access.</p>
        )}
      </div>
      <BannerForm
        initial={{
          id: banner.id,
          type: banner.type,
          title: banner.title,
          body: banner.body,
          ctaLabel: banner.ctaLabel,
          ctaUrl: banner.ctaUrl,
          imageUrl: banner.imageUrl,
          imageMobileUrl: banner.imageMobileUrl,
          pages: banner.pages,
          isActive: banner.isActive,
          sortOrder: banner.sortOrder,
          startsAt: banner.startsAt ? banner.startsAt.toISOString() : null,
          endsAt: banner.endsAt ? banner.endsAt.toISOString() : null,
        }}
        canEdit={canEdit}
      />
    </div>
  );
}
