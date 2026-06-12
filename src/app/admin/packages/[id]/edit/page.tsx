import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PackageForm } from "@/components/admin/packages/PackageForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tour = await prisma.tour.findUnique({ where: { id }, select: { title: true } });
  return { title: tour ? `Edit: ${tour.title} — Admin` : "Edit Package — Admin" };
}

function safeParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

export default async function EditPackagePage({ params }: Props) {
  const { id } = await params;
  const tour = await prisma.tour.findUnique({ where: { id } });
  if (!tour) notFound();

  const defaults = {
    id: tour.id,
    title: tour.title,
    slug: tour.slug,
    category: tour.category,
    duration: tour.duration,
    excerpt: tour.excerpt ?? "",
    description: tour.description ?? "",
    coverImage: tour.coverImage ?? "",
    priceFrom: tour.priceFrom,
    priceWas: tour.priceWas,
    discountPct: tour.discountPct,
    bestseller: tour.bestseller,
    published: tour.published,
    itinerary: safeParse<{ day: number; title: string; description: string }[]>(tour.itinerary, []),
    inclusions: safeParse<string[]>(tour.inclusions, []),
    exclusions: safeParse<string[]>(tour.exclusions, []),
    gallery: safeParse<string[]>(tour.gallery, []),
    metaTitle: tour.metaTitle ?? "",
    metaDesc: tour.metaDesc ?? "",
    ogImage: tour.ogImage ?? "",
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-gray-400">
          <li><Link href="/admin/packages" className="hover:text-brand-green transition-colors">Packages</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-brand-navy font-medium line-clamp-1 max-w-[200px]">{tour.title}</li>
        </ol>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-brand-navy text-xl">Edit Package</h2>
          <p className="text-gray-400 text-xs mt-0.5">{tour.title}</p>
        </div>
        <a
          href={`/tours/${tour.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-green font-semibold hover:underline shrink-0"
        >
          View Live ↗
        </a>
      </div>

      <PackageForm defaults={defaults} />
    </div>
  );
}
