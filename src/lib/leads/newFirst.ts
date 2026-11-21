import "server-only";
import { LeadStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * The admin Leads list order: every NEW lead first (not contacted yet — the
 * day's work), then everything else; each group most recently updated first.
 * Prisma can't order by "status = NEW", so it pages across the two groups:
 * NEW rows fill the page first, the rest continue after them. `take`
 * undefined = no paging (the IP-investigation view loads every match).
 */
export async function findLeadsNewFirst<S extends Prisma.LeadSelect>(
  where: Prisma.LeadWhereInput,
  { select, skip = 0, take }: { select: S; skip?: number; take?: number },
): Promise<Prisma.LeadGetPayload<{ select: S }>[]> {
  const newWhere: Prisma.LeadWhereInput = { AND: [where, { status: LeadStatus.NEW }] };
  const restWhere: Prisma.LeadWhereInput = { AND: [where, { status: { not: LeadStatus.NEW } }] };
  const orderBy = { updatedAt: "desc" } as const;

  if (take === undefined) {
    const [fresh, rest] = await Promise.all([
      prisma.lead.findMany({ where: newWhere, orderBy, select }),
      prisma.lead.findMany({ where: restWhere, orderBy, select }),
    ]);
    return [...fresh, ...rest] as Prisma.LeadGetPayload<{ select: S }>[];
  }

  const newCount = await prisma.lead.count({ where: newWhere });
  const fresh =
    skip < newCount
      ? await prisma.lead.findMany({ where: newWhere, orderBy, select, skip, take })
      : [];
  const remaining = take - fresh.length;
  const rest =
    remaining > 0
      ? await prisma.lead.findMany({
          where: restWhere,
          orderBy,
          select,
          skip: Math.max(0, skip - newCount),
          take: remaining,
        })
      : [];
  return [...fresh, ...rest] as Prisma.LeadGetPayload<{ select: S }>[];
}
