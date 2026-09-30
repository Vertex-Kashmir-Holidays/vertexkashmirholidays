// One-off backfill: rename every proposal and itinerary (standalone, lead-,
// booking-linked and B2B) to the standard "<customer name> - <duration> -
// <phone>" name (see src/lib/itinerary/documentTitle.ts), unique per table.
// New saves already produce this name; this brings existing rows in line.
//
//  - The phone comes from the document's customerPhone, falling back to the
//    linked lead's phone / booking's guest phone — which is then also written
//    into the document so the name keeps it on the next save.
//  - Clashes: the oldest record keeps the plain name, later ones get " (2)",
//    " (3)"…
//  - Version history rows are left as they are, and updatedAt is preserved
//    (raw SQL) so the lists — sorted by last update — keep their order.
//
// Dry run by default (prints the plan). Idempotent: re-running is a no-op
// once names are standard.
//
// Usage: npx tsx --env-file=.env scripts/standardize-itinerary-titles.ts [--apply]
// Uses whatever DATABASE_URL is active — run on dev first, then on live after
// pointing .env at the live database.

import { PrismaClient, type Prisma } from "@prisma/client";
import { buildDocumentTitle } from "../src/lib/itinerary/documentTitle";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

type Row = {
  id: string;
  title: string;
  data: Prisma.JsonValue;
  fallbackPhone: string;
};

type Plan = { id: string; from: string; to: string; data?: Record<string, unknown> };

const str = (v: unknown) => (typeof v === "string" ? v : "");

function plan(rows: Row[]): Plan[] {
  const taken = new Set<string>();
  const out: Plan[] = [];
  for (const row of rows) {
    const doc =
      row.data && typeof row.data === "object" && !Array.isArray(row.data)
        ? (row.data as Record<string, unknown>)
        : {};
    const ownPhone = str(doc.customerPhone).trim();
    const phone = ownPhone || row.fallbackPhone.trim();
    const base = buildDocumentTitle({
      preparedFor: str(doc.preparedFor),
      duration: str(doc.duration),
      customerPhone: phone,
    });
    let title = base;
    for (let n = 2; taken.has(title.toLowerCase()); n++) title = `${base.slice(0, 194)} (${n})`;
    taken.add(title.toLowerCase());

    const backfillPhone = !ownPhone && !!phone && Object.keys(doc).length > 0;
    if (title !== row.title || backfillPhone) {
      out.push({
        id: row.id,
        from: row.title,
        to: title,
        ...(backfillPhone ? { data: { ...doc, customerPhone: phone } } : {}),
      });
    }
  }
  return out;
}

function print(label: string, total: number, changes: Plan[]) {
  console.log(`\n${label}: ${changes.length} of ${total} to update`);
  for (const c of changes) {
    console.log(`  ${c.id}  "${c.from}"  →  "${c.to}"${c.data ? "  (+ phone)" : ""}`);
  }
}

async function main() {
  const dbName = new URL(process.env.DATABASE_URL ?? "postgres://x/unknown").pathname.slice(1);
  console.log(`Database: ${dbName}  —  ${apply ? "APPLYING changes" : "dry run (pass --apply to write)"}`);

  const proposals = await prisma.proposalItinerary.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, data: true },
  });
  const proposalPlan = plan(proposals.map((p) => ({ ...p, fallbackPhone: "" })));

  const itineraries = await prisma.itinerary.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      data: true,
      lead: { select: { phone: true } },
      booking: { select: { guestPhone: true } },
    },
  });
  const itineraryPlan = plan(
    itineraries.map((i) => ({
      id: i.id,
      title: i.title,
      data: i.data,
      fallbackPhone: i.lead?.phone ?? i.booking?.guestPhone ?? "",
    })),
  );

  print("Proposals", proposals.length, proposalPlan);
  print("Itineraries (incl. lead/booking/B2B)", itineraries.length, itineraryPlan);

  if (!apply) return;

  const update = (table: "ProposalItinerary" | "Itinerary", c: Plan) =>
    c.data
      ? prisma.$executeRawUnsafe(
          `UPDATE "${table}" SET "title" = $1, "data" = $2::jsonb WHERE "id" = $3`,
          c.to,
          JSON.stringify(c.data),
          c.id,
        )
      : prisma.$executeRawUnsafe(`UPDATE "${table}" SET "title" = $1 WHERE "id" = $2`, c.to, c.id);

  await prisma.$transaction([
    ...proposalPlan.map((c) => update("ProposalItinerary", c)),
    ...itineraryPlan.map((c) => update("Itinerary", c)),
  ]);
  console.log(`\nDone: ${proposalPlan.length} proposals, ${itineraryPlan.length} itineraries updated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
