import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ActivityForm } from "@/components/admin/activities/ActivityForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({ where: { id }, select: { name: true } });
  return { title: activity ? `Edit: ${activity.name} — Admin` : "Edit Activity — Admin" };
}

export const dynamic = "force-dynamic";

export default async function EditActivityPage({ params }: Props) {
  const { id } = await params;
  const [activity, destinations, tours] = await Promise.all([
    prisma.activity.findUnique({
      where: { id },
      include: { destinations: { select: { destinationId: true } }, tours: { select: { tourId: true } } },
    }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tour.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!activity) notFound();

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/admin/activities" className="hover:text-primary transition-colors">Activities</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{activity.name}</li>
        </ol>
      </nav>
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">Edit Activity</h2>
        <p className="text-muted-foreground text-xs mt-0.5">{activity.name}</p>
      </div>
      <ActivityForm
        defaults={{
          id: activity.id,
          name: activity.name,
          slug: activity.slug,
          description: activity.description ?? "",
          location: activity.location ?? "",
          icon: activity.icon ?? "",
          duration: activity.duration ?? "",
          price: activity.price != null ? String(activity.price) : "",
          coverImage: activity.coverImage ?? "",
          coverImageMobile: activity.coverImageMobile ?? "",
          images: activity.images ?? "[]",
          ogImage: activity.ogImage ?? "",
          metaTitle: activity.metaTitle ?? "",
          metaDesc: activity.metaDesc ?? "",
          published: activity.published,
          destinationIds: activity.destinations.map((d) => d.destinationId),
          tourIds: activity.tours.map((t) => t.tourId),
        }}
        destinationOptions={destinations.map((d) => ({ id: d.id, label: d.name }))}
        tourOptions={tours.map((t) => ({ id: t.id, label: t.title }))}
      />
    </div>
  );
}
