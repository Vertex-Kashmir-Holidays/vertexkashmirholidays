import { Prisma, PrismaClient } from "@prisma/client";
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
// connect_timeout is a separate concern: Neon's compute auto-suspends after
// inactivity to save cost, and a `next build`'s first query (prerendering
// tours/destinations/blog/legal pages via generateStaticParams) can land
// while it's still asleep. The default connect timeout gives up before Neon
// finishes waking up, failing the whole Vercel build with P1001 "Can't reach
// database server" — a manual redeploy then "fixes" it only because the
// failed attempt already woke the compute. 15s comfortably covers Neon's
// typical cold-start window without slowing down the (much more common)
// already-warm case.
//
// DATABASE_URL is guaranteed set by this point — importing `env` above
// throws a clear error at module load if it's missing, before Prisma ever
// gets a chance to fail with its own opaque schema-validation error.
function datasourceUrl(): string {
  const url = new URL(env.DATABASE_URL);
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "10");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "30");
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "15");
  return url.toString();
}

// Belt-and-braces alongside the connect_timeout bump above: if a query still
// lands mid-wake-up, retry a few times with a short backoff instead of
// failing the entire build over one cold query. Two distinct Prisma error
// shapes both mean "couldn't connect" and are worth retrying:
// - PrismaClientKnownRequestError with code P1001/P1002 — a query-time
//   connection failure once the engine's already up and running.
// - PrismaClientInitializationError — thrown instead when the very first
//   connection attempt on a freshly-created client fails (no `.code`, just
//   an optional `.errorCode`), which is exactly the shape of a cold Vercel
//   build's first-ever query against a still-sleeping Neon compute.
// Anything else (validation errors, unique-constraint violations, etc.) is a
// real error and rethrows immediately, unretried.
function isRetryableConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === "P1001" || err.code === "P1002")
  );
}

const RETRY_DELAYS_MS = [1000, 2000, 4000];

// Cast back to the plain PrismaClient type: the extension only wraps query
// execution at runtime, it adds nothing callers need to see, and several
// call sites (e.g. src/lib/bookings/customer.ts) type their `$transaction`
// callback parameter as `Prisma.TransactionClient` — the un-extended type —
// so the exported client's type must stay exactly what it was before.
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({ datasourceUrl: datasourceUrl() });
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          for (let attempt = 0; ; attempt++) {
            try {
              return await query(args);
            } catch (err) {
              if (attempt >= RETRY_DELAYS_MS.length || !isRetryableConnectionError(err)) throw err;
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
            }
          }
        },
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
