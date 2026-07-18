import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LeadForm } from "@/components/admin/leads/LeadForm";

export const metadata: Metadata = { title: "New Lead — Admin" };
export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES"] }, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/leads" className="hover:text-primary transition-colors">
              Leads
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium">Add New</li>
        </ol>
      </nav>
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">Add Lead</h2>
        <p className="text-muted-foreground text-xs mt-0.5">Create a new lead manually</p>
      </div>
      <LeadForm staffUsers={staffUsers} />
    </div>
  );
}
