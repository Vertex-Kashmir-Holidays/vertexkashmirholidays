import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdventuresList } from "@/components/admin/pages/AdventuresList";

export const metadata: Metadata = { title: "Adventures — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAdventureListPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "adventures", "view"))) redirect("/admin/dashboard");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    can(role, "adventures", "create"),
    can(role, "adventures", "edit"),
    can(role, "adventures", "delete"),
  ]);

  const adventures = await prisma.adventure.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, slug: true, published: true, updatedAt: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">Adventures</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Landing-page adventures shown at /adventure/[slug].
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/adventures/new"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New Adventure
          </Link>
        )}
      </div>
      <AdventuresList items={adventures} canEdit={canEdit} canDelete={canDelete} />
    </div>
  );
}
