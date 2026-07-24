import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JobForm } from "@/components/admin/careers/JobForm";

export const metadata: Metadata = { title: "New Job — Admin" };

export default function NewJobPage() {
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
          <li className="text-foreground font-medium">Add New</li>
        </ol>
      </nav>
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">Add Job</h2>
        <p className="text-muted-foreground text-xs mt-0.5">Create a new job opening</p>
      </div>
      <JobForm />
    </div>
  );
}
