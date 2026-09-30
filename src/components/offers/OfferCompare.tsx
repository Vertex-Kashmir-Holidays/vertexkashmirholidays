import { Info } from "lucide-react";
import { formatINR } from "@/lib/accents";
import { COMPARE_INCLUDED, COMPARE_NOT_INCLUDED, type OfferCompareRow } from "@/lib/offers/content";
import type { OfferPlanView } from "@/lib/offers/view";
import { OfferPlanCta } from "./OfferPlanCta";
import { OfferCompareMobile } from "./OfferCompareMobile";
import {
  CompareCellView,
  type CompareCell,
  type CompareRowData,
  type CompareSectionData,
} from "./OfferCompareCell";

const isOff = (v: string | undefined) => {
  const t = (v ?? "").trim().toLowerCase();
  return !t || t === COMPARE_NOT_INCLUDED.toLowerCase();
};

/** Admin value → cell: "Included" ✓, "Not included"/blank —, anything else as written. */
function valueCell(value: string | undefined): CompareCell {
  if (isOff(value)) return { kind: "none" };
  const v = value!.trim();
  if (v.toLowerCase() === COMPARE_INCLUDED.toLowerCase()) return { kind: "included" };
  return { kind: "text", text: v };
}

const text = (t: string | null | undefined): CompareCell =>
  t ? { kind: "text", text: t } : { kind: "none" };

// "Compare Plans" — answers "why pay more?" at a glance, in sections: price,
// stays (nights per place, class), meals, transport (the plan's vehicle plus
// admin rows such as union cabs), activities and any other admin-defined
// group. Stay rows are derived from the plans' nights; the rest comes from
// Admin → Offers → Packages & Pricing → Compare rows. Empty sections are left
// out.
//  - md+: a table, with a "Choose <plan>" CTA row at the end.
//  - phones: one plan at a time (OfferCompareMobile) instead of a wide table.
// Below both, a "Tailor your plan" note lists what can be added or removed.
export function OfferCompare({
  plans,
  places,
  compareRows,
}: {
  plans: OfferPlanView[];
  places: string[];
  compareRows: OfferCompareRow[];
}) {
  if (plans.length < 2) return null;

  const classOf = (p: OfferPlanView): CompareCell => {
    const cls = [...new Set(p.stays.map((s) => s.category).filter(Boolean))].join(" / ");
    return cls ? { kind: "text", text: cls, strong: true } : { kind: "none" };
  };
  const customRows = (group: string): CompareRowData[] =>
    compareRows
      .filter((r) => r.group === group)
      .map((r) => ({ label: r.label, cells: plans.map((p) => valueCell(p.compareValues[r.id])) }));
  const otherGroups = [...new Set(compareRows.map((r) => r.group))].filter(
    (g) => g !== "Transport" && g !== "Activities" && g !== "Meals",
  );

  const sections: CompareSectionData[] = [
    {
      title: null,
      rows: [
        {
          label: "Price for 2 adults",
          cells: plans.map((p): CompareCell => ({
            kind: "text",
            text: formatINR(p.priceForTwo),
            strong: true,
          })),
        },
      ],
    },
    {
      title: "Stays",
      rows: [
        ...places.map((place) => ({
          label: place === "Houseboat" ? "Houseboat nights" : `Nights in ${place}`,
          cells: plans.map((p): CompareCell => {
            const n = p.split.find((s) => s.label === place)?.nights;
            return n ? { kind: "nights", nights: n } : { kind: "none" };
          }),
        })),
        ...(plans.some((p) => p.stays.some((s) => s.category))
          ? [{ label: "Stay class", cells: plans.map(classOf), emphasis: true }]
          : []),
      ],
    },
    {
      title: "Meals",
      rows: [
        ...(plans.some((p) => p.mealPlan)
          ? [{ label: "Meal plan", cells: plans.map((p) => text(p.mealPlan)) }]
          : []),
        ...customRows("Meals"),
      ],
    },
    {
      title: "Transport",
      rows: [
        ...(plans.some((p) => p.vehicle)
          ? [{ label: "Vehicle", cells: plans.map((p) => text(p.vehicle)) }]
          : []),
        ...customRows("Transport"),
      ],
    },
    { title: "Activities", rows: customRows("Activities") },
    ...otherGroups.map((g) => ({ title: g, rows: customRows(g) })),
  ].filter((s) => s.rows.length > 0);

  // "Tailor your plan" — in table order: extras some plan doesn't include can
  // be added (price goes up); items some plan includes can be removed (down).
  const ordered = ["Meals", "Transport", "Activities", ...otherGroups].flatMap((g) =>
    compareRows.filter((r) => r.group === g),
  );
  const addOnRows = ordered.filter((r) => plans.some((p) => isOff(p.compareValues[r.id])));
  const removableRows = ordered.filter((r) => plans.some((p) => !isOff(p.compareValues[r.id])));
  const list = (rows: OfferCompareRow[]) => {
    const labels = rows.map((r) => r.label);
    return labels.length > 1
      ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`
      : labels[0];
  };

  return (
    <div className="space-y-4">
      <div className="md:hidden">
        <OfferCompareMobile plans={plans} sections={sections} />
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:block">
        <table className="w-full text-[14px]">
          <thead>
            <tr>
              <th className="border-b border-border px-4 py-4 text-left text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                Package
              </th>
              {plans.map((p) => (
                <th
                  key={p.id}
                  className="border-b border-border px-4 py-4 text-center text-[15px] font-bold text-foreground"
                >
                  {p.name}
                  <span className="block text-[12px] font-semibold text-muted-foreground">
                    {formatINR(p.priceForTwo)}
                  </span>
                  {p.badge && (
                    <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wide text-primary">
                      {p.badge}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          {sections.map((section, si) => (
            <tbody key={section.title ?? si} className="divide-y divide-border">
              {section.title && (
                <tr className="bg-muted/50">
                  <th
                    scope="rowgroup"
                    colSpan={plans.length + 1}
                    className="px-4 py-2.5 text-left text-[12px] font-bold uppercase tracking-[0.14em] text-primary"
                  >
                    {section.title}
                  </th>
                </tr>
              )}
              {section.rows.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={`px-4 py-3.5 text-left ${row.emphasis ? "text-[15px] font-bold text-foreground" : "font-semibold text-foreground/80"}`}
                  >
                    {row.label}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td key={plans[i].id} className="px-4 py-3.5 text-center text-foreground">
                      <CompareCellView cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-4" />
              {plans.map((p) => (
                <td key={p.id} className="px-4 py-4 text-center">
                  <OfferPlanCta plan={p.name} highlight={!!p.badge} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {(addOnRows.length > 0 || removableRows.length > 0) && (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-4 text-[14px] leading-relaxed text-foreground/80 sm:px-5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-1.5">
            <p className="font-bold text-foreground">Tailor your package</p>
            <ul className="list-disc space-y-1 pl-4">
              {addOnRows.length > 0 && (
                <li>
                  <b className="text-foreground">Add extras:</b>{" "}
                  {`${list(addOnRows)} can be added to any package on request. The package price is revised to include them.`}
                </li>
              )}
              {removableRows.length > 0 && (
                <li>
                  <b className="text-foreground">Remove inclusions:</b>{" "}
                  {`Don't need something that's included, such as the ${list(removableRows)}? We can take it out and reduce the package price accordingly.`}
                </li>
              )}
            </ul>
            <p className="text-[13px] text-muted-foreground">
              Final pricing for any changes is confirmed by our team before you book.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
