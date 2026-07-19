import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { Briefcase, MapPin, Clock, IndianRupee, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList } from "@/components/seo/JsonLd";
import { parseStringList } from "@/lib/tours/content";
import { JobViewedTracker } from "@/components/careers/JobViewedTracker";
import { JobApplyForm } from "@/components/careers/JobApplyForm";

export const revalidate = 300;

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

// Without this, Next.js has no known slug list to pre-render and falls back
// to fully dynamic rendering on every request regardless of `revalidate`
// (same reasoning as Blog/Destinations' detail pages).
export async function generateStaticParams() {
  const jobs = await prisma.job.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return jobs.map((j) => ({ slug: j.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getJob = cache(async (slug: string) => prisma.job.findUnique({ where: { slug } }));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job || !job.published) {
    return buildMetadata({
      title: "Job Not Found",
      description: "The job opening you are looking for could not be found.",
      canonical: `${SITE_URL}/careers/${slug}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: job.metaTitle ?? `${job.title} — Careers`,
    description: job.metaDesc ?? job.shortDescription,
    canonical: `${SITE_URL}/careers/${slug}`,
    ogImage: job.ogImage ?? null,
  });
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[14px] text-muted-foreground">
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job || !job.published) notFound();

  const responsibilities = parseStringList(job.responsibilities);
  const requirements = parseStringList(job.requirements);
  const preferredSkills = parseStringList(job.preferredSkills);
  const benefits = parseStringList(job.benefits);

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Careers", url: `${SITE_URL}/careers` },
    { name: job.title, url: `${SITE_URL}/careers/${job.slug}` },
  ]);

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      <JobViewedTracker jobTitle={job.title} jobId={job.id} />

      <div className="mx-auto max-w-[1300px] px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/careers" className="hover:text-primary transition-colors">
            Careers
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate">{job.title}</span>
        </nav>

        <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr]">
          <article className="min-w-0">
            <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-bold text-primary">
              {job.department}
            </span>
            <h1 className="h-display mt-3 text-3xl font-bold sm:text-4xl">{job.title}</h1>
            <p className="mt-3 text-[15px] text-muted-foreground">{job.shortDescription}</p>

            <div className="mt-6">
              <h2 className="font-display text-lg font-bold text-foreground">About the Role</h2>
              <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-muted-foreground">
                {job.aboutRole}
              </p>
            </div>

            <Section title="Responsibilities" items={responsibilities} />
            <Section title="Requirements" items={requirements} />
            <Section title="Preferred Skills" items={preferredSkills} />
            <Section title="Benefits" items={benefits} />
          </article>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
            <h3 className="font-bold text-foreground text-sm">Job Overview</h3>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                <dt className="sr-only">Employment Type</dt>
                <dd>{EMPLOYMENT_LABELS[job.employmentType]}</dd>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <dt className="sr-only">Location</dt>
                <dd>{job.location}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <dt className="sr-only">Experience</dt>
                <dd>{job.experience}</dd>
              </div>
              {job.salary && (
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <dt className="sr-only">Salary</dt>
                  <dd>{job.salary}</dd>
                </div>
              )}
            </dl>
            <JobApplyForm jobId={job.id} jobTitle={job.title} />
          </aside>
        </div>
      </div>
    </div>
  );
}
