import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DestinationForm } from "@/components/admin/destinations/DestinationForm";

export const metadata: Metadata = { title: "New Destination — Admin" };

export default function NewDestinationPage() {
  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/admin/destinations" className="hover:text-primary transition-colors">Destinations</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium">Add New</li>
        </ol>
      </nav>
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">Add Destination</h2>
        <p className="text-muted-foreground text-xs mt-0.5">Create a new destination for Kashmir tours</p>
      </div>
      <DestinationForm />
    </div>
  );
}
