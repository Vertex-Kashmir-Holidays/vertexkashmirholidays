import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import { isAdminRole } from "@/lib/itinerary/access";
import { publishedPackageOptions } from "@/lib/tours/content";
import { bandForPrice, trimTourTitle } from "@/lib/leads/qualification";
import { BudgetBandsClient, type CoverageItem } from "@/components/admin/leads/BudgetBandsClient";

export const metadata: Metadata = { title: "Budget Bands — Admin" };
export const dynamic = "force-dynamic";

export default async function BudgetBandsPage() {
  const guard = await requireModuleView("leads");
  if (!guard.ok) return guard.page;
  const isAdmin = isAdminRole(guard.role);

  const [bands, tours, offers] = isAdmin
    ? await Promise.all([
        prisma.budgetBand.findMany({
          orderBy: [{ isActive: "desc" }, { minAmount: "asc" }],
        }),
        prisma.tour.findMany({
          where: { published: true },
          orderBy: { priceFrom: "asc" },
          select: { title: true, priceFrom: true, packageOptions: true },
        }),
        prisma.occasionOffer.findMany({
          orderBy: { sortOrder: "asc" },
          select: {
            name: true,
            published: true,
            packages: {
              where: { published: true },
              orderBy: { sortOrder: "asc" },
              select: { name: true, priceForTwo: true },
            },
          },
        }),
      ])
    : [[], [], []];

  // Coverage: every price a visitor can be shown, per person, and the band it
  // falls in today — so a gap at either end is visible before it costs a lead.
  const active = bands.filter((b) => b.isActive);
  const coverage: CoverageItem[] = [
    ...tours.flatMap((t) => {
      const options = publishedPackageOptions(t.packageOptions);
      const rows = options.length
        ? options.map((o) => ({
            name: `${trimTourTitle(t.title)} — ${o.name}`,
            pp: o.priceForTwo / 2,
          }))
        : [{ name: trimTourTitle(t.title), pp: t.priceFrom }];
      return rows.map((r) => ({ kind: "Tour", ...r }));
    }),
    ...offers.flatMap((o) =>
      o.packages.map((p) => ({
        kind: o.published ? "Offer" : "Offer (unpublished)",
        name: `${o.name} — ${p.name}`,
        pp: p.priceForTwo / 2,
      })),
    ),
  ].map((r) => ({
    kind: r.kind,
    name: r.name,
    pricePerPerson: r.pp,
    band: bandForPrice(active, r.pp)?.label ?? null,
  }));

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/leads" className="hover:text-primary transition-colors">
              Leads
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium">Budget bands</li>
        </ol>
      </nav>
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">Budget bands</h2>
        <p className="text-muted-foreground text-xs mt-0.5">
          The &ldquo;budget per person&rdquo; options in lead forms and the WhatsApp modal. Set
          where each band starts — each one ends ₹1 below the next, the last is open-ended, and
          labels are generated, so there are never gaps. Deactivate to retire a band (never deleted;
          existing leads keep the label they were captured with).
        </p>
      </div>
      {isAdmin ? (
        <BudgetBandsClient
          bands={bands.map((b) => ({
            id: b.id,
            key: b.key,
            label: b.label,
            minAmount: b.minAmount,
            isActive: b.isActive,
          }))}
          coverage={coverage}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Only an admin can manage budget bands.</p>
      )}
    </div>
  );
}
