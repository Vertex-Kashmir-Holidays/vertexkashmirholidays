// One-off backfill: recompute every HotelSupplier's `category` under the
// current rule (Deluxe room's MAP rate, 0-2,000 Budget / 2,001-3,500 3 Star /
// 3,501-7,000 4 Star / 7,001+ 5 Star — see src/lib/hotelSuppliers/schema.ts's
// computeCategoryFromMap). `category` is only ever recomputed client-side
// when a hotel is individually saved, so any hotel not touched since the
// category rule last changed still has its OLD-rule value on file — this
// script closes that gap once, in bulk, instead of waiting for every hotel
// to be manually re-saved. Idempotent: safe to re-run, a no-op for any hotel
// already correct.
//
// Usage: npx tsx scripts/recompute-hotel-categories.ts
// Uses whatever DATABASE_URL is active in the environment — run once per
// environment (dev now, prod right after the schema migration is applied
// there).

import { PrismaClient } from "@prisma/client";
import { hotelDataSchema, computeCategoryFromMap, getDeluxeMapRate } from "../src/lib/hotelSuppliers/schema";

const prisma = new PrismaClient();

async function main() {
  const hotels = await prisma.hotelSupplier.findMany({
    select: { id: true, hotelName: true, category: true, data: true },
  });

  let updated = 0;
  let unparseable = 0;

  for (const hotel of hotels) {
    const parsed = hotelDataSchema.safeParse(hotel.data);
    if (!parsed.success) {
      unparseable++;
      console.warn(`[skip] "${hotel.hotelName}" (${hotel.id}) — data failed schema parse.`);
      continue;
    }

    const newCategory = computeCategoryFromMap(getDeluxeMapRate(parsed.data.rate));
    if (newCategory === hotel.category) continue;

    await prisma.hotelSupplier.update({ where: { id: hotel.id }, data: { category: newCategory } });
    console.log(`[updated] "${hotel.hotelName}": ${hotel.category} -> ${newCategory}`);
    updated++;
  }

  console.log(
    `\nDone. ${hotels.length} hotels checked, ${updated} category values updated, ${unparseable} skipped (unparseable data).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
