import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ActivityForm } from "@/components/admin/activities/ActivityForm";

export const metadata: Metadata = { title: "New Activity — Admin" };
// Fetches destination/tour options for the link pickers, so it touches the DB.
export const dynamic = "force-dynamic";

export default async function NewActivityPage() {
  const [destinations, tours] = await Promise.all([
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tour.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/admin/activities" className="hover:text-primary transition-colors">Activities</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium">Add New</li>
        </ol>
      </nav>
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">Add Activity</h2>
        <p className="text-muted-foreground text-xs mt-0.5">Create a thing to do and link it to destinations &amp; tours</p>
      </div>
      <ActivityForm
        destinationOptions={destinations.map((d) => ({ id: d.id, label: d.name }))}
        tourOptions={tours.map((t) => ({ id: t.id, label: t.title }))}
      />
    </div>
  );
}
