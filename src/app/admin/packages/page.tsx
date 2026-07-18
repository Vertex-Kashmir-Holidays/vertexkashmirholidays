import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PackagesClient } from "@/components/admin/packages/PackagesClient";

export const metadata: Metadata = { title: "Packages — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const session = await auth();
  const role = session!.user.role;

  const [tours, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.tour.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        duration: true,
        priceFrom: true,
        rating: true,
        reviewCount: true,
        published: true,
        bestseller: true,
        createdAt: true,
        coverImage: true,
      },
    }),
    can(role, "packages", "create"),
    can(role, "packages", "edit"),
    can(role, "packages", "delete"),
  ]);

  return (
    <PackagesClient
      initialTours={tours}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
