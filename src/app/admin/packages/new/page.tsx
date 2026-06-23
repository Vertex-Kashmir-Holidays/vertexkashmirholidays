import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PackageForm } from "@/components/admin/packages/PackageForm";

export const metadata: Metadata = { title: "New Package — Admin" };
// Loads activity options for the "Things to Do" picker, so it touches the DB.
export const dynamic = "force-dynamic";

export default async function NewPackagePage() {
  const activities = await prisma.activity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/admin/packages" className="hover:text-primary transition-colors">Packages</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium">Add New Package</li>
        </ol>
      </nav>

      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">Add New Package</h2>
        <p className="text-muted-foreground text-xs mt-0.5">
          Create a new tour package with pricing, itinerary and media.
        </p>
      </div>

      <PackageForm activityOptions={activities.map((a) => ({ id: a.id, label: a.name }))} />
    </div>
  );
}
