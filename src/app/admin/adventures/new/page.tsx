import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AdventureForm } from "@/components/admin/pages/AdventureForm";

export const metadata: Metadata = { title: "New Adventure — Admin" };
export const dynamic = "force-dynamic";

export default async function NewAdventurePage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "adventures", "create"))) redirect("/admin/adventures");

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/adventures"
          className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" /> All Adventures
        </Link>
        <h2 className="font-display text-xl font-extrabold text-foreground">New Adventure</h2>
      </div>
      <AdventureForm initial={null} canEdit />
    </div>
  );
}
