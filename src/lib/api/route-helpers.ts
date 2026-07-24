// Shared boilerplate for the hand-rolled admin CRUD routes (banners,
// galleries, activities, faqs, destinations, and similar) — see VERTE-36.
// Each of these routes has genuinely different resource-specific logic
// (relation joins, slug generation, Cloudinary cleanup, custom GET
// filtering) that stays inline in the route file; only the identical
// request-parsing / validation / existence-check / error-mapping blocks
// that were hand-copied across every route move here.
import { NextResponse } from "next/server";
import type { z, ZodTypeAny } from "zod";

type Result<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

// Every POST/PATCH route hand-rolled this identical try/catch around
// `req.json()`.
export async function parseJsonBody(req: Request): Promise<Result<unknown>> {
  try {
    return { ok: true, data: await req.json() };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }
}

// Every POST/PATCH route hand-rolled this identical safeParse + 422 shape.
export function parseWithSchema<T extends ZodTypeAny>(schema: T, data: unknown): Result<z.infer<T>> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, response: NextResponse.json({ error: parsed.error.flatten() }, { status: 422 }) };
  }
  return { ok: true, data: parsed.data };
}

// Every PATCH/DELETE (and several GET-by-id) routes hand-rolled this
// identical "load or 404" check. Takes the finder call itself so it works
// with any model's own findUnique shape (select/include vary per resource).
export async function requireExisting<T>(finder: () => Promise<T | null>): Promise<Result<T>> {
  const existing = await finder();
  if (!existing) {
    return { ok: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { ok: true, data: existing };
}

// Every create/update on a uniquely-slugged resource hand-rolled this same
// Prisma P2002 → 409 mapping, falling back to a generic 500 otherwise.
export function mapPrismaError(err: unknown, conflictMessage: string, genericMessage: string): NextResponse {
  const msg = err instanceof Error ? err.message : "";
  if (msg.includes("P2002")) {
    return NextResponse.json({ error: conflictMessage }, { status: 409 });
  }
  return NextResponse.json({ error: genericMessage }, { status: 500 });
}
