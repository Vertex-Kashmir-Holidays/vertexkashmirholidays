// One-off, idempotent data seed for the new Salary/Leave modules' default
// permissions. Run once per environment (dev now; prod at deploy time).
//
// Self-service (viewing/applying for YOUR OWN salary/leave) is never
// permission-gated in the app code — but the sidebar nav item itself IS
// filtered by the standard `permissions[key]?.view` check like every other
// module, so every staff role needs `view=true` for salary/leave by default
// or employees would never see the nav link to reach their own self-service
// page. ADMIN additionally gets `edit=true` (the "Finance" capability — org-
// wide payroll/leave management) as a sensible default; reassign via the
// Roles & Permissions UI if a different role should hold it.
//
// Usage: npx tsx scripts/seed-salary-leave-permissions.ts

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const STAFF_VIEW_ONLY: Role[] = ["ADMIN", "DEVELOPER", "SALES", "EDITOR"];
const MODULES = ["salary", "leave"] as const;

async function main() {
  for (const moduleKey of MODULES) {
    for (const role of STAFF_VIEW_ONLY) {
      const isAdmin = role === "ADMIN";
      await prisma.rolePermission.upsert({
        where: { role_module: { role, module: moduleKey } },
        update: { canView: true, ...(isAdmin ? { canEdit: true } : {}) },
        create: {
          role,
          module: moduleKey,
          canView: true,
          canCreate: isAdmin,
          canEdit: isAdmin,
          canDelete: false,
        },
      });
    }
  }
  console.log("Seeded default salary/leave permissions.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
