import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DestinationsClient } from "@/components/admin/destinations/DestinationsClient";

export const metadata: Metadata = { title: "Destinations — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDestinationsPage() {
  const destinations = await prisma.destination.findMany({
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
  });

  return <DestinationsClient initialDestinations={destinations} />;
}
