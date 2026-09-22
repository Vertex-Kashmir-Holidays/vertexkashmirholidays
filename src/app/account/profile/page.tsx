import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/ProfileForm";
import { AgencyDetailsCard } from "@/components/account/AgencyDetailsCard";
import { AgencyDocsCard } from "@/components/account/AgencyDocsCard";
import { B2B_VISIBLE_DOC_CATEGORIES } from "@/lib/docs/categories";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      phone: true,
      agencyStatus: true,
      agencyName: true,
      agencyLogoUrl: true,
      agencyWebsite: true,
      agencyRegistrationNumber: true,
      agencyGstin: true,
      agencyState: true,
    },
  });

  const docs = user?.agencyStatus
    ? await prisma.adminDocument.findMany({
        where: { category: { in: B2B_VISIBLE_DOC_CATEGORIES as string[] } },
        orderBy: [{ category: "asc" }, { createdAt: "desc" }],
        select: { id: true, title: true, category: true, url: true, sizeBytes: true },
      })
    : [];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">Profile</h1>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ProfileForm
          initialName={user?.name ?? session.user.name ?? ""}
          email={user?.email ?? session.user.email ?? ""}
          initialImage={user?.image ?? ""}
        />
        {user?.agencyStatus && (
          <AgencyDetailsCard
            agencyStatus={user.agencyStatus}
            agencyName={user.agencyName}
            agencyLogoUrl={user.agencyLogoUrl}
            agencyWebsite={user.agencyWebsite}
            agencyRegistrationNumber={user.agencyRegistrationNumber}
            agencyGstin={user.agencyGstin}
            agencyState={user.agencyState}
            contactPerson={user.name ?? session.user.name ?? ""}
            phone={user.phone}
            email={user.email}
          />
        )}
      </div>
      {/* Desktop already shows Documents as a persistent sidebar (AccountShell) */}
      {user?.agencyStatus && (
        <div className="lg:hidden">
          <AgencyDocsCard docs={docs} />
        </div>
      )}
    </div>
  );
}
