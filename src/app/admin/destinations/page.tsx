import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DestinationsClient } from "@/components/admin/destinations/DestinationsClient";

export const metadata: Metadata = { title: "Destinations — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDestinationsPage() {
  const session = await auth();
  const role = session!.user.role;

  const [destinations, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.destination.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        location: true,
        createdAt: true,
        _count: { select: { tours: true } },
      },
    }),
    can(role, "destinations", "create"),
    can(role, "destinations", "edit"),
    can(role, "destinations", "delete"),
  ]);

  return (
    <DestinationsClient
      initialDestinations={destinations}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
