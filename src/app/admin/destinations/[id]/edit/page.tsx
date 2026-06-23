import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DestinationForm } from "@/components/admin/destinations/DestinationForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dest = await prisma.destination.findUnique({ where: { id }, select: { name: true } });
  return { title: dest ? `Edit: ${dest.name} — Admin` : "Edit Destination — Admin" };
}

export default async function EditDestinationPage({ params }: Props) {
  const { id } = await params;
  const dest = await prisma.destination.findUnique({ where: { id } });
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
          altitude: dest.altitude ?? "",
          season: dest.season ?? "",
          region: dest.region ?? "",
          latitude: dest.latitude != null ? String(dest.latitude) : "",
          longitude: dest.longitude != null ? String(dest.longitude) : "",
          metaTitle: dest.metaTitle ?? "",
          metaDesc: dest.metaDesc ?? "",
          ogImage: dest.ogImage ?? "",
        }}
      />
    </div>
  );
}
