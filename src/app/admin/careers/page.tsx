import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CareersClient } from "@/components/admin/careers/CareersClient";

export const metadata: Metadata = { title: "Careers — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCareersPage() {
  const session = await auth();
  const role = session!.user.role;

  const [jobs, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        department: true,
        employmentType: true,
        location: true,
        published: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    can(role, "careers", "create"),
    can(role, "careers", "edit"),
    can(role, "careers", "delete"),
  ]);

  return (
    <CareersClient
      initialJobs={jobs}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
