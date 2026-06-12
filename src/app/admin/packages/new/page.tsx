import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PackageForm } from "@/components/admin/packages/PackageForm";

export const metadata: Metadata = { title: "New Package — Admin" };

export default function NewPackagePage() {
  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-gray-400">
          <li><Link href="/admin/packages" className="hover:text-brand-green transition-colors">Packages</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-brand-navy font-medium">Add New Package</li>
        </ol>
      </nav>

      <div>
        <h2 className="font-display font-extrabold text-brand-navy text-xl">Add New Package</h2>
        <p className="text-gray-400 text-xs mt-0.5">
          Create a new tour package with pricing, itinerary and media.
        </p>
      </div>

      <PackageForm />
    </div>
  );
}
