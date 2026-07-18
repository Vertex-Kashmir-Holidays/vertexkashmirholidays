import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { GalleriesClient } from "@/components/admin/galleries/GalleriesClient";

export const metadata: Metadata = { title: "Gallery — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminGalleriesPage() {
  const session = await auth();
  const role = session!.user.role;

  const [items, totalCount, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.gallery.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.gallery.count(),
    can(role, "galleries", "create"),
    can(role, "galleries", "edit"),
    can(role, "galleries", "delete"),
  ]);

  const categories = Array.from(
    new Set(items.map((i) => i.category).filter((c): c is string => c !== null && c !== "")),
  ).sort();

  return (
    <GalleriesClient
      initialItems={items}
      totalCount={totalCount}
      categories={categories}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
