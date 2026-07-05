// src/components/sections/TourDetailsBudget.tsx
// Server component — no 'use client', no framer-motion. Matches the
// TourDetailsTravelInfo pattern: native <details> accordion items, so this
// section ships zero extra JS and stays fully crawlable.
import { TourDetailsAccordionItem } from './TourDetailsAccordionItem';
import type { BudgetRow, PersonalExpenseRow } from '@/types/tours';

interface TourDetailsBudgetProps {
  budgetBreakdown: BudgetRow[];
  personalExpenses: PersonalExpenseRow[];
}

export function TourDetailsBudget({ budgetBreakdown, personalExpenses }: TourDetailsBudgetProps) {
  const hasBudget = budgetBreakdown.length > 0;
  const hasExpenses = personalExpenses.length > 0;
  if (!hasBudget && !hasExpenses) return null;

  return (
    <section id="budget" className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
      <h2 className="text-[17px] font-bold">Budget</h2>
      <div className="mt-4 space-y-3">
        {hasBudget && (
          <TourDetailsAccordionItem title="Estimated Total Trip Budget">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-foreground/60">
                    <th className="pb-2 pr-3 font-semibold">Category</th>
                    <th className="pb-2 pr-3 font-semibold">Per Person</th>
                    <th className="pb-2 pr-3 font-semibold">Per Family</th>
                    <th className="pb-2 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetBreakdown.map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 font-semibold text-foreground">{row.category}</td>
                      <td className="py-2 pr-3 text-foreground/75">{row.perPerson}</td>
                      <td className="py-2 pr-3 text-foreground/75">{row.perFamily}</td>
                      <td className="py-2 text-foreground/60">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TourDetailsAccordionItem>
        )}

        {hasExpenses && (
          <TourDetailsAccordionItem title="Estimated Personal Expenses">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-foreground/60">
                    <th className="pb-2 pr-3 font-semibold">Activity / Expense</th>
                    <th className="pb-2 pr-3 font-semibold">Approx. Cost</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {personalExpenses.map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 font-semibold text-foreground">{row.activity}</td>
                      <td className="py-2 pr-3 text-foreground/75">{row.cost}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                            row.mandatory ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground/60'
                          }`}
                        >
                          {row.mandatory ? 'Mandatory' : 'Optional'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TourDetailsAccordionItem>
        )}
      </div>
    </section>
  );
}
