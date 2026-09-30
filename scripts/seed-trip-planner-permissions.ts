// One-off, idempotent data seed for the new Trip Planner page module's
// default permissions — same reasoning as scripts/seed-docs-permissions.ts:
// without this, the new "tripPlanner" module key starts fully denied for
// every non-SUPERADMIN role (emptyPermissionMap() in src/lib/rbac.ts), so
// the sidebar link and /admin/trip-planner would be invisible to everyone
// but SUPERADMIN until someone happens to flip it on in the Roles UI.
//
// Matches prisma/seed.ts's PERMISSION_DEFAULTS for this module exactly
// (same split as home/about/contact): ADMIN/DEVELOPER/EDITOR get full
// access, SALES gets none (a marketing landing page, not a sales tool).
// Reassign via the Roles & Permissions UI if a different split is wanted.
//
// Usage: npx tsx scripts/seed-trip-planner-permissions.ts

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const MODULE = "tripPlanner";
const FULL_ACCESS_ROLES: Role[] = ["ADMIN", "DEVELOPER", "EDITOR"];
const NO_ACCESS_ROLES: Role[] = ["SALES"];

async function main() {
  for (const role of [...FULL_ACCESS_ROLES, ...NO_ACCESS_ROLES]) {
    const full = FULL_ACCESS_ROLES.includes(role);
    await prisma.rolePermission.upsert({
      where: { role_module: { role, module: MODULE } },
      update: { canView: full, canCreate: full, canEdit: full, canDelete: full },
      create: {
        role,
        module: MODULE,
        canView: full,
        canCreate: full,
        canEdit: full,
        canDelete: full,
      },
    });
  }
  console.log("Seeded default Trip Planner page permissions.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
