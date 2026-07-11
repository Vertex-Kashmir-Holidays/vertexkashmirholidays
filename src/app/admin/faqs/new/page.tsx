import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FaqForm } from "@/components/admin/faqs/FaqForm";

export const metadata: Metadata = { title: "New FAQ — Admin" };

export default async function NewFaqPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "faqs", "create"))) redirect("/admin/faqs");

  const [categories, tours, destinations, blogs, campaigns, activities] = await Promise.all([
    prisma.faqCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.tour.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.blog.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.campaign.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.activity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/admin/faqs" className="hover:text-primary transition-colors">FAQs</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium">New</li>
        </ol>
      </nav>

      <FaqForm
        categoryOptions={categories.map((c) => ({ id: c.id, label: c.name }))}
        tourOptions={tours.map((t) => ({ id: t.id, label: t.title }))}
        destinationOptions={destinations.map((d) => ({ id: d.id, label: d.name }))}
        blogOptions={blogs.map((b) => ({ id: b.id, label: b.title }))}
        campaignOptions={campaigns.map((c) => ({ id: c.id, label: c.name }))}
        activityOptions={activities.map((a) => ({ id: a.id, label: a.name }))}
      />
    </div>
  );
}
