// One-off backfill (2026-11-20): conversion credit and commission follow the
// lead's CURRENT assignee. Before this rule, a lead an admin converted on a
// trainee's behalf and then reassigned to them kept its commission with the
// admin (or had none). For every converted, non-B2B lead with a booking, this
// moves the booking's commission to the lead's current assignee via
// moveBookingCommission() — settled rows (PAID / REVERSED / claimed by a
// payroll run) are never touched. Idempotent: safe to re-run.
//
// Usage:
//   npx tsx scripts/commission-follow-assignee.ts           # dry run (report only)
//   npx tsx scripts/commission-follow-assignee.ts --apply   # make the changes
// Uses whatever DATABASE_URL is active — pass it explicitly per environment.

import { PrismaClient } from "@prisma/client";
import { moveBookingCommission } from "../src/lib/bookings/commissionSync";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const leads = await prisma.lead.findMany({
    where: { status: "CONVERTED", b2bAgentId: null, bookingId: { not: null } },
    select: {
      id: true,
      name: true,
      bookingId: true,
      assignedToId: true,
      assignedTo: { select: { name: true, email: true, bookingConversionPct: true } },
      booking: {
        select: {
          commission: {
            select: { employeeId: true, status: true, salaryRecordId: true, employee: { select: { name: true } } },
          },
        },
      },
    },
  });

  let toMove = 0;
  for (const l of leads) {
    const c = l.booking?.commission ?? null;
    const settled = c && (c.status === "PAID" || c.status === "REVERSED" || c.salaryRecordId != null);
    const hasRate = (l.assignedTo?.bookingConversionPct ?? 0) > 0;
    const needs = c ? !settled && c.employeeId !== l.assignedToId : !!l.assignedToId && hasRate;
    if (!needs) continue;
    toMove++;
    const to = l.assignedTo?.name ?? l.assignedTo?.email ?? "nobody";
    const from = c ? (c.employee.name ?? c.employeeId) : "no commission row";
    console.log(`${l.name} (#${l.id.slice(-8).toUpperCase()}): ${from} → ${to}${hasRate ? "" : " (no rate — row removed)"}`);
    if (apply) await moveBookingCommission(prisma, l.bookingId!, l.assignedToId);
  }
  console.log(`\n${leads.length} converted leads checked, ${toMove} ${apply ? "updated" : "would change (dry run — add --apply)"}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
