import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DestinationForm } from "@/components/admin/destinations/DestinationForm";

export const metadata: Metadata = { title: "New Destination — Admin" };

export default function NewDestinationPage() {
  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-gray-400">
          <li><Link href="/admin/destinations" className="hover:text-brand-green transition-colors">Destinations</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-brand-navy font-medium">Add New</li>
        </ol>
      </nav>
      <div>
        <h2 className="font-display font-extrabold text-brand-navy text-xl">Add Destination</h2>
        <p className="text-gray-400 text-xs mt-0.5">Create a new destination for Kashmir tours</p>
      </div>
      <DestinationForm />
    </div>
  );
}
