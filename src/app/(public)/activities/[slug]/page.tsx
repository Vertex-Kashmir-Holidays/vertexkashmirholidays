import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList } from "@/components/seo/JsonLd";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { HeroLeadCard } from "@/components/leads/HeroLeadCard";
import { imgSrc } from "@/lib/placeholder";
import { formatINR } from "@/lib/accents";
import { MapPin, Clock, BadgeIndianRupee } from "lucide-react";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function getActivity(slug: string) {
  return prisma.activity.findFirst({
    where: { slug, published: true },
    include: {
      tours: {
        where: { tour: { published: true } },
        include: { tour: { select: { slug: true, title: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = await prisma.activity.findFirst({
    where: { slug, published: true },
    select: { name: true, description: true, coverImage: true, metaTitle: true, metaDesc: true, ogImage: true },
  });

  if (!activity) {
    return buildMetadata({
      title: "Activity Not Found",
      description: "The Kashmir activity you are looking for could not be found.",
      canonical: `${SITE_URL}/activities/${slug}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: activity.metaTitle ?? activity.name,
    description:
      activity.metaDesc ??
      activity.description ??
      `${activity.name} — a handpicked Kashmir experience by Vertex Kashmir Holidays.`,
    canonical: `${SITE_URL}/activities/${slug}`,
    ogImage: activity.ogImage ?? activity.coverImage ?? null,
  });
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const activity = await getActivity(slug);
  if (!activity) notFound();

  const gallery = parseJson<string[]>(activity.images, []);
  const relatedTours = activity.tours.map((t) => t.tour);

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Activities", url: `${SITE_URL}/activities` },
    { name: activity.name, url: `${SITE_URL}/activities/${activity.slug}` },
  ]);

  const meta: { icon: typeof MapPin; label: string }[] = [
    ...(activity.location ? [{ icon: MapPin, label: activity.location }] : []),
    ...(activity.duration ? [{ icon: Clock, label: activity.duration }] : []),
    ...(activity.price != null
      ? [{ icon: BadgeIndianRupee, label: `From ${formatINR(activity.price)} / person` }]
      : []),
  ];

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />

      <SecondaryHero
        image={activity.coverImage ?? "/hero/gulmarg-lg.webp"}
        alt={activity.name}
        aside={<HeroLeadCard source="activity-detail" buttonLabel="Enquire Now" />}
      >
        <nav className="flex items-center gap-2 text-[12px] text-white/80" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <span>›</span>
          <Link href="/activities" className="transition hover:text-white">Activities</Link>
          <span>›</span>
          <span className="font-semibold text-white">{activity.name}</span>
        </nav>
        <h1 className="mt-6 h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]">
          {activity.name}
        </h1>
        {meta.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {meta.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/35 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur"
              >
                <m.icon className="h-4 w-4" strokeWidth={1.8} /> {m.label}
              </span>
            ))}
          </div>
        )}
      </SecondaryHero>

      <main className="mx-auto max-w-[1100px] px-6 py-10">
        {activity.description && (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[21px] font-bold">About this experience</h2>
            <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-foreground/85">
              {activity.description}
            </p>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[21px] font-bold">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {gallery.map((src, i) => (
                <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src={imgSrc(src)}
                    alt={`${activity.name} ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedTours.length > 0 && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[21px] font-bold">Available on these tours</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {relatedTours.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tours/${t.slug}`}
                  className="rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  {t.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
