import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import { can } from "@/lib/permissions";
import { ExpensesClient } from "@/components/admin/finance/ExpensesClient";

export const metadata: Metadata = { title: "Expenses — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminExpensesPage() {
  const guard = await requireModuleView("expenses");
  if (!guard.ok) return guard.page;
  const { role } = guard;

  const canCreate = await can(role, "expenses", "create");
  const canEdit = await can(role, "expenses", "edit");
  const canDelete = await can(role, "expenses", "delete");

  const [rows, total, categories, employees] = await Promise.all([
    prisma.expense.findMany({
      where: { deletedAt: null },
      orderBy: { date: "desc" },
      take: 20,
      select: {
        id: true,
        date: true,
        amount: true,
        description: true,
        paymentMethod: true,
        reference: true,
        notes: true,
        salaryRecordId: true,
        createdAt: true,
        category: { select: { id: true, name: true, isSystem: true } },
        employee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.expense.count({ where: { deletedAt: null } }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES", "EDITOR"] }, deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const initialExpenses = rows.map((r) => ({
    ...r,
    date: r.date.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <ExpensesClient
      initialExpenses={initialExpenses}
      initialTotal={total}
      categories={categories}
      employees={employees}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
