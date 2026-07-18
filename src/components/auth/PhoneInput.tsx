"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { ChevronDown } from "lucide-react";

// ISO-3166 alpha-2 → flag emoji (regional indicator symbols).
function flagOf(code: string): string {
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

interface PhoneInputProps {
  id?: string;
  country: CountryCode;
  onCountryChange: (c: CountryCode) => void;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}

/**
 * Country-aware phone field: a searchable country-code dropdown (flag + name +
 * dial code) plus a national-number input. The parent validates with
 * libphonenumber-js (see @/lib/auth/validation).
 */
export function PhoneInput({
  id,
  country,
  onCountryChange,
  value,
  onChange,
  invalid,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const countries = useMemo(
    () =>
      getCountries()
        .map((code) => ({
          code,
          name: regionNames?.of(code) ?? code,
          dial: getCountryCallingCode(code),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [countries, query]);

  // Close the dropdown on any outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const dial = getCountryCallingCode(country);

  return (
    <div
      ref={wrapRef}
      className={`input-wrap relative mt-1.5 ${invalid ? "ring-1 ring-red-500/60" : ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select country code, currently +${dial}`}
        className="ml-3.5 flex shrink-0 items-center gap-1.5 border-r border-border pr-3 text-[14px] font-semibold"
      >
        <span aria-hidden="true">{flagOf(country)}</span>
        <span className="text-muted-foreground">+{dial}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" strokeWidth={2.4} />
      </button>

      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="Enter your phone number"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d\s()-]/g, ""))}
      />

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card shadow-soft"
        >
          <div className="sticky top-0 z-10 bg-card p-2">
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              type="text"
              placeholder="Search country or code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none focus:border-primary"
            />
          </div>
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              role="option"
              aria-selected={c.code === country}
              onClick={() => {
                onCountryChange(c.code);
                setOpen(false);
                setQuery("");
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] transition hover:bg-muted ${
                c.code === country ? "bg-primary/10 font-semibold" : ""
              }`}
            >
              <span aria-hidden="true">{flagOf(c.code)}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-muted-foreground">+{c.dial}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-[14px] text-muted-foreground">
              No countries match “{query}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
