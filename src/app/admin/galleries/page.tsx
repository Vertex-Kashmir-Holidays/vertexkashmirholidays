import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { GalleriesClient } from "@/components/admin/galleries/GalleriesClient";

export const metadata: Metadata = { title: "Gallery — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminGalleriesPage() {
  const [items, totalCount] = await Promise.all([
    prisma.gallery.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.gallery.count(),
  ]);

  const categories = Array.from(
    new Set(items.map((i) => i.category).filter((c): c is string => c !== null && c !== ""))
  ).sort();

  return (
    <GalleriesClient
      initialItems={items}
      totalCount={totalCount}
      categories={categories}
    />
  );
}
