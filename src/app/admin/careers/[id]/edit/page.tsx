import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { JobForm } from "@/components/admin/careers/JobForm";
import { parseStringList } from "@/lib/tours/content";

type Props = { params: Promise<{ id: string }> };

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getJob = cache(async (id: string) => prisma.job.findUnique({ where: { id } }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  return { title: job ? `Edit: ${job.title} — Admin` : "Edit Job — Admin" };
}

export const dynamic = "force-dynamic";

export default async function EditJobPage({ params }: Props) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/careers" className="hover:text-primary transition-colors">
              Careers
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{job.title}</li>
        </ol>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Edit Job</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{job.title}</p>
        </div>
        {job.published && (
          <a
            href={`/careers/${job.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-semibold hover:underline shrink-0"
          >
            View Live ↗
          </a>
        )}
      </div>
      <JobForm
        defaults={{
          id: job.id,
          title: job.title,
          slug: job.slug,
          department: job.department,
          employmentType: job.employmentType,
          experience: job.experience,
          location: job.location,
          salary: job.salary ?? "",
          shortDescription: job.shortDescription,
          aboutRole: job.aboutRole,
          responsibilities: parseStringList(job.responsibilities),
          requirements: parseStringList(job.requirements),
          preferredSkills: parseStringList(job.preferredSkills),
          benefits: parseStringList(job.benefits),
          published: job.published,
          metaTitle: job.metaTitle ?? "",
          metaDesc: job.metaDesc ?? "",
          ogImage: job.ogImage ?? "",
        }}
      />
    </div>
  );
}
