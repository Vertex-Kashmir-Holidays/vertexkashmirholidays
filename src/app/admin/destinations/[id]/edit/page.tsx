import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DestinationForm } from "@/components/admin/destinations/DestinationForm";
import { parseStringList, parseTopAttractions, parseFoodOrShop, parseIdList } from "@/lib/destinations/content";

type Props = { params: Promise<{ id: string }> };

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getDestination = cache(async (id: string) =>
  prisma.destination.findUnique({ where: { id }, include: { activities: { select: { activityId: true } } } }),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dest = await getDestination(id);
  return { title: dest ? `Edit: ${dest.name} — Admin` : "Edit Destination — Admin" };
}

export const dynamic = "force-dynamic";

export default async function EditDestinationPage({ params }: Props) {
  const { id } = await params;
  const [dest, activities, blogs] = await Promise.all([
    getDestination(id),
    prisma.activity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.blog.findMany({ where: { published: true }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!dest) notFound();

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/admin/destinations" className="hover:text-primary transition-colors">Destinations</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{dest.name}</li>
        </ol>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Edit Destination</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{dest.name}</p>
        </div>
        <a href={`/destinations/${dest.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-semibold hover:underline shrink-0">
          View Live ↗
        </a>
      </div>
      <DestinationForm
        defaults={{
          id: dest.id,
          name: dest.name,
          slug: dest.slug,
          location: dest.location ?? "",
          excerpt: dest.excerpt ?? "",
          description: dest.description ?? "",
          coverImage: dest.coverImage ?? "",
          coverImageMobile: dest.coverImageMobile ?? "",
          altitude: dest.altitude ?? "",
          season: dest.season ?? "",
          region: dest.region ?? "",
          latitude: dest.latitude != null ? String(dest.latitude) : "",
          longitude: dest.longitude != null ? String(dest.longitude) : "",
          whyVisit: parseStringList(dest.whyVisit),
          topAttractions: parseTopAttractions(dest.topAttractions),
          bestTimeDetail: dest.bestTimeDetail ?? "",
          howToReach: dest.howToReach ?? "",
          whereToStay: dest.whereToStay ?? "",
          localFood: parseFoodOrShop(dest.localFood),
          shopping: parseFoodOrShop(dest.shopping),
          travelTips: parseStringList(dest.travelTips),
          metaTitle: dest.metaTitle ?? "",
          metaDesc: dest.metaDesc ?? "",
          ogImage: dest.ogImage ?? "",
          ogTitle: dest.ogTitle ?? "",
          ogDescription: dest.ogDescription ?? "",
          activityIds: dest.activities.map((a) => a.activityId),
          relatedBlogIds: parseIdList(dest.relatedBlogIds),
        }}
        activityOptions={activities.map((a) => ({ id: a.id, label: a.name }))}
        blogOptions={blogs.map((b) => ({ id: b.id, label: b.title }))}
      />
    </div>
  );
}
