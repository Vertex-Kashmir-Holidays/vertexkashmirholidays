import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdventureForm } from "@/components/admin/pages/AdventureForm";

export const metadata: Metadata = { title: "Edit Adventure — Admin" };
export const dynamic = "force-dynamic";

export default async function EditAdventurePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "adventures", "view"))) redirect("/admin/dashboard");

  const { id } = await params;
  const [adventure, canEdit] = await Promise.all([
    prisma.adventure.findUnique({ where: { id } }),
    can(role, "adventures", "edit"),
  ]);
  if (!adventure) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/adventures"
            className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" /> All Adventures
          </Link>
          <h2 className="font-display text-xl font-extrabold text-foreground">
            Edit: {adventure.name}
          </h2>
          {!canEdit && (
            <p className="text-xs text-amber-600 dark:text-amber-400">You have read-only access.</p>
          )}
        </div>
        <Link
          href={`/adventures/${adventure.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          View live <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <AdventureForm initial={adventure} canEdit={canEdit} />
    </div>
  );
}
