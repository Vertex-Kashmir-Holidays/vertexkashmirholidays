// One-off, idempotent data seed for the Rate Cards module's default
// permissions — same reasoning as scripts/seed-docs-permissions.ts: a new
// module key starts fully denied for every non-SUPERADMIN role, so without
// this the sidebar link would be invisible to everyone but SUPERADMIN.
//
// Default: every staff role can VIEW (the sales lookup screen); ADMIN can
// also create/edit (duplicate, edit, activate, restore). Reassign via the
// Roles & Permissions UI if a different split is wanted.
//
// Usage (always name the database explicitly):
//   DATABASE_URL=<url> npx tsx scripts/seed-rate-card-permissions.ts

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const STAFF_ROLES: Role[] = ["ADMIN", "DEVELOPER", "SALES", "EDITOR"];
const MODULE = "rateCards";

async function main() {
  for (const role of STAFF_ROLES) {
    const isAdmin = role === "ADMIN";
    await prisma.rolePermission.upsert({
      where: { role_module: { role, module: MODULE } },
      update: { canView: true, ...(isAdmin ? { canCreate: true, canEdit: true, canDelete: true } : {}) },
      create: {
        role,
        module: MODULE,
        canView: true,
        canCreate: isAdmin,
        canEdit: isAdmin,
        canDelete: isAdmin,
      },
    });
  }
  console.log("Seeded default rateCards permissions.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
