import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  HotelSuppliersClient,
  type HotelSupplierRecord,
} from "@/components/admin/hotel-suppliers/HotelSuppliersClient";
import { hotelDataSchema, type HotelData } from "@/lib/hotelSuppliers/schema";

export const metadata: Metadata = { title: "Hotel Rates — Admin" };
export const dynamic = "force-dynamic";

const EMPTY_DATA: HotelData = {
  property: { location: null, contactPerson: null, phone: null, email: null, mapUrl: null },
  rate: null,
  rating: null,
};

export default async function AdminHotelSuppliersPage() {
  const session = await auth();
  const role = session!.user.role;

  const [rows, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.hotelSupplier.findMany({
      orderBy: [{ destination: "asc" }, { hotelName: "asc" }],
    }),
    can(role, "hotelSuppliers", "create"),
    can(role, "hotelSuppliers", "edit"),
    can(role, "hotelSuppliers", "delete"),
  ]);

  const hotels: HotelSupplierRecord[] = rows.map((row) => {
    const parsed = hotelDataSchema.safeParse(row.data);
    return {
      id: row.id,
      hotelName: row.hotelName,
      destination: row.destination,
      category: row.category,
      isActive: row.isActive,
      data: parsed.success ? parsed.data : EMPTY_DATA,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  return (
    <HotelSuppliersClient
      initialHotels={hotels}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
