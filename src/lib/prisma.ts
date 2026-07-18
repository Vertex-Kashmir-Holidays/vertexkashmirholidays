import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Neon's `-pooler` host already does connection pooling server-side (PgBouncer),
// so Prisma's own client-side pool just needs to not be the bottleneck. Left
// unset, Prisma defaults connection_limit to a small value derived from the
// build machine's CPU count (as low as 3 on a constrained Vercel builder),
// which Next's parallel static-generation workers exhaust immediately —
// surfaces as P2024 "Timed out fetching a new connection from the pool."
//
// DATABASE_URL is guaranteed set by this point — importing `env` above
// throws a clear error at module load if it's missing, before Prisma ever
// gets a chance to fail with its own opaque schema-validation error.
function datasourceUrl(): string {
  const url = new URL(env.DATABASE_URL);
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "10");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "30");
  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: datasourceUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
