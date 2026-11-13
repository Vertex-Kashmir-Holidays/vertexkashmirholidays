import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getConfirmedStayStats } from "@/lib/trips/board";
import { HotelSuppliersClient } from "@/components/admin/hotel-suppliers/HotelSuppliersClient";
import { toHotelSupplierRecord } from "@/lib/hotelSuppliers/record";

export const metadata: Metadata = { title: "Hotel Rates — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminHotelSuppliersPage() {
  const session = await auth();
  const role = session!.user.role;

  const [rows, canCreate, canEdit, stayStats] = await Promise.all([
    prisma.hotelSupplier.findMany({
      orderBy: [{ destination: "asc" }, { hotelName: "asc" }],
    }),
    can(role, "hotelSuppliers", "create"),
    can(role, "hotelSuppliers", "edit"),
    getConfirmedStayStats(),
  ]);

  const hotels = rows.map((row) => toHotelSupplierRecord(row, stayStats));

  return (
    <HotelSuppliersClient
      initialHotels={hotels}
      canCreate={canCreate}
      canEdit={canEdit}
    />
  );
}
