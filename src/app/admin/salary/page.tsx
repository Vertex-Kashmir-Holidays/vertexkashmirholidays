import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { previousCompletedMonth } from "@/lib/salary/month";
import { SalaryClient } from "@/components/admin/salary/SalaryClient";
import type { Role } from "@/lib/rbac";

export const metadata: Metadata = { title: "Salary — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSalaryPage() {
  const session = await auth();
  const role = session?.user?.role as Role;
  const isFinance = await can(role, "salary", "edit");

  return <SalaryClient isFinance={isFinance} defaultMonth={previousCompletedMonth()} />;
}
