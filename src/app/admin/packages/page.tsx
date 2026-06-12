import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PackagesClient } from "@/components/admin/packages/PackagesClient";

export const metadata: Metadata = { title: "Packages — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const tours = await prisma.tour.findMany({
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
  });

  return <PackagesClient initialTours={tours} />;
}
