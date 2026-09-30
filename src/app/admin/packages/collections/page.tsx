import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CollectionsClient } from "@/components/admin/packages/CollectionsClient";

export const metadata: Metadata = { title: "Tour Collections — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminTourCollectionsPage() {
  const session = await auth();
  const role = session!.user.role;

  const [collections, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.tourCollection.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        published: true,
        sortOrder: true,
        tours: { select: { published: true } },
      },
    }),
    can(role, "packages", "create"),
    can(role, "packages", "edit"),
    can(role, "packages", "delete"),
  ]);

  return (
    <CollectionsClient
      collections={collections.map(({ tours, ...c }) => ({
        ...c,
        tourCount: tours.length,
        publishedTourCount: tours.filter((t) => t.published).length,
      }))}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
