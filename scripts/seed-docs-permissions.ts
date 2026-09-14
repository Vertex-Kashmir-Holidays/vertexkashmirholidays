// One-off, idempotent data seed for the new Docs module's default permissions.
// Run once per environment (dev now; prod at deploy time) — same reasoning as
// scripts/seed-salary-leave-permissions.ts: without this, a brand-new module
// key starts fully denied for every non-SUPERADMIN role (emptyPermissionMap()
// in src/lib/rbac.ts), so the sidebar link and page would be invisible to
// everyone but SUPERADMIN until someone happens to flip it on in the Roles UI.
//
// Default: every staff role can view/download; ADMIN additionally gets
// create/edit/delete (upload, rename, remove documents). Reassign via the
// Roles & Permissions UI if a different split is wanted.
//
// Usage: npx tsx scripts/seed-docs-permissions.ts

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const STAFF_ROLES: Role[] = ["ADMIN", "DEVELOPER", "SALES", "EDITOR"];
const MODULE = "docs";

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
  console.log("Seeded default docs permissions.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
