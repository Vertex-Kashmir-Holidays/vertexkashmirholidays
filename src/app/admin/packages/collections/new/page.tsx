import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CollectionForm } from "@/components/admin/packages/CollectionForm";

export const metadata: Metadata = { title: "New Tour Collection — Admin" };

export default function NewTourCollectionPage() {
  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link
              href="/admin/packages/collections"
              className="hover:text-primary transition-colors"
            >
              Tour Collections
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium">Add New</li>
        </ol>
      </nav>
      <h2 className="font-display font-extrabold text-foreground text-xl">Add Tour Collection</h2>
      <CollectionForm />
    </div>
  );
}
