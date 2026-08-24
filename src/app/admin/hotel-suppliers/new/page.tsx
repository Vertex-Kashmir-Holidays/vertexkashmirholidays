import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HotelSupplierForm } from "@/components/admin/hotel-suppliers/HotelSupplierForm";

export const metadata: Metadata = { title: "Add Hotel — Admin" };

export default async function NewHotelSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination } = await searchParams;
  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/hotel-suppliers" className="hover:text-primary transition-colors">
              Hotel Rates
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium">Add Hotel</li>
        </ol>
      </nav>
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">Add Hotel</h2>
        <p className="text-muted-foreground text-xs mt-0.5">
          Add a supplier hotel and its net rates. Only the exact rates the supplier quoted — no markup here.
        </p>
      </div>
      <HotelSupplierForm defaultDestination={destination} />
    </div>
  );
}
