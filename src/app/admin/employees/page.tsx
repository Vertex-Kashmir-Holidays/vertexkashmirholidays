import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { EmployeesClient } from "@/components/admin/employees/EmployeesClient";

export const metadata: Metadata = { title: "Employees — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage() {
  const session = await auth();

  const employees = await prisma.user.findMany({
    where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES", "EDITOR"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      designation: true,
      employeeCode: true,
      monthlySalary: true,
      bookingConversionPct: true,
      joiningDate: true,
      personalEmail: true,
      personalPhone: true,
      address: true,
      deletedAt: true,
      createdAt: true,
    },
  });

  return (
    <EmployeesClient
      initialEmployees={employees}
      currentUserId={session?.user?.id ?? ""}
      currentUserRole={session?.user?.role ?? ""}
    />
  );
}
