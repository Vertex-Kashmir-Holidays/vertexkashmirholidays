import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList } from "@/components/seo/JsonLd";
import { CareersViewedTracker } from "@/components/careers/CareersViewedTracker";
import { SecondaryHero } from "@/components/layout/SecondaryHero";

export const revalidate = 300;

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Careers at Vertex Kashmir Holidays",
    description:
      "Explore current job openings at Vertex Kashmir Holidays and join our team building unforgettable Kashmir travel experiences.",
    canonical: `${SITE_URL}/careers`,
  });
}

function fmtDate(d: Date | null) {
  return d
    ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
}

export default async function CareersPage() {
  const jobs = await prisma.job.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      department: true,
      employmentType: true,
      experience: true,
      location: true,
      shortDescription: true,
      publishedAt: true,
    },
  });

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Careers", url: `${SITE_URL}/careers` },
  ]);

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      <CareersViewedTracker />

      <SecondaryHero compact alt="Careers at Vertex Kashmir Holidays">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-[14px] text-white/85"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>›</span>
          <span className="font-semibold text-white">Careers</span>
        </nav>
        <h1 className="h-display mt-3 text-3xl font-bold text-white sm:text-4xl">Join Our Team</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Help us build unforgettable Kashmir travel experiences.
        </p>
      </SecondaryHero>

      <section className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6 sm:py-12">
        {jobs.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              We&apos;re not hiring at the moment.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link
                key={job.slug}
                href={`/careers/${job.slug}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-bold text-primary">
                  {job.department}
                </span>
                <h2 className="mt-3 font-display text-lg font-bold text-foreground group-hover:text-primary">
                  {job.title}
                </h2>
                <p className="mt-2 text-[14px] text-muted-foreground line-clamp-2">
                  {job.shortDescription}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {EMPLOYMENT_LABELS[job.employmentType]}
                  </span>
                  <span>{job.experience}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[12px] text-muted-foreground">
                    {fmtDate(job.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1 text-[13px] font-bold text-primary">
                    Apply Now <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
