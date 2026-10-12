"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import {
  LATER,
  UNDECIDED,
  travelMonthKeys,
  travelMonthText,
  type Qualification,
} from "@/lib/leads/qualification";

interface QualificationFieldsProps {
  value: Partial<Qualification>;
  onChange: (next: Partial<Qualification>) => void;
  /** Field errors (lead forms); the WhatsApp modal disables its button instead. */
  errors?: { budgetBandKey?: string; travelMonth?: string };
  /** False in tour/activity contexts — only the travel month is asked. */
  showBudget?: boolean;
  /** Tour context: the budget derived from the tour's price, shown read-only. */
  derivedBudget?: string;
  className?: string;
}

// The two lead-qualification questions, as dropdowns. Shared by every lead
// form and the WhatsApp modal so the wording and options never drift apart.
// Budget bands come from the admin-managed BudgetBand table (via
// SiteSettingsProvider); travel months are generated from the current month.
export function QualificationFields({
  value,
  onChange,
  errors,
  showBudget = true,
  derivedBudget,
  className,
}: QualificationFieldsProps) {
  const { budgetBands } = useSiteSettings();
  const months = useMemo(() => travelMonthKeys(), []);

  const budgetOptions = [
    ...budgetBands.map((b) => ({ key: b.key, label: b.label })),
    { key: UNDECIDED, label: "Not sure yet" },
  ];
  // Full names: "October 2026" … "Later than April 2027".
  const monthOptions = [
    ...months.map((m) => ({ key: m, label: travelMonthText(m) })),
    { key: LATER, label: travelMonthText(LATER).replace(/^l/, "L") },
    { key: UNDECIDED, label: "Not sure yet" },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {showBudget && (
        <Dropdown
          label="What's your budget per person?"
          placeholder="Select budget"
          options={budgetOptions}
          value={value.budgetBandKey}
          onChange={(budgetBandKey) => onChange({ ...value, budgetBandKey })}
          error={errors?.budgetBandKey}
        />
      )}
      {derivedBudget && (
        <p className="rounded-xl bg-muted/60 px-4 py-2.5 text-[13px] text-foreground/80">
          Budget: <span className="font-semibold text-foreground">{derivedBudget}</span>
        </p>
      )}
      <Dropdown
        label="When are you planning to travel?"
        placeholder="Select month"
        options={monthOptions}
        value={value.travelMonth}
        onChange={(travelMonth) => onChange({ ...value, travelMonth })}
        error={errors?.travelMonth}
      />
    </div>
  );
}

function Dropdown({
  label,
  hint,
  placeholder,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  options: { key: string; label: string }[];
  value?: string;
  onChange: (key: string) => void;
  error?: string;
}) {
  // A page can show a lead form and the WhatsApp modal at once — unique ids.
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-[14px] font-semibold text-foreground/90">
        {label} <span className="text-primary">*</span>
      </label>
      {hint && <p className="mt-0.5 text-[12px] text-muted-foreground">{hint}</p>}
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn(
          "mt-2 w-full cursor-pointer rounded-xl border border-input bg-card px-4 py-3 text-[15px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25",
          value ? "text-foreground" : "text-foreground/45",
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.key} value={o.key} className="text-foreground">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
