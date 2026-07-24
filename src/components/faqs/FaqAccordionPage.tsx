"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqRelatedLink {
  id: string;
  slug: string;
  title?: string;
  name?: string;
}

interface FaqAccordionItem {
  id: string;
  question: string;
  answer: string;
  slug: string;
  tours: FaqRelatedLink[];
  destinations: FaqRelatedLink[];
}

interface FaqAccordionCategory {
  id: string;
  name: string;
  description: string | null;
  faqs: FaqAccordionItem[];
}

interface FaqAccordionPageProps {
  categories: FaqAccordionCategory[];
}

// Full knowledge-base accordion for /faq. Collapsed by default, one FAQ open
// at a time across the whole page (opening a new one closes the previous),
// smooth height animation via the grid-template-rows 0fr/1fr trick. Deep
// links from other pages' "Read Full Answer" CTAs land as /faq#<slug> — on
// mount this opens and scrolls to that exact question, replacing the old
// vanilla-DOM approach used before this accordion became React-state-driven.
export function FaqAccordionPage({ categories }: FaqAccordionPageProps) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const exists = categories.some((c) => c.faqs.some((f) => f.slug === hash));
    if (!exists) return;
    setOpenSlug(hash);
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    // Only ever needs to run once, on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter(
          (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.faqs.length > 0);
  }, [categories, search]);

  const totalMatches = filteredCategories.reduce((n, c) => n + c.faqs.length, 0);

  return (
    <div className="space-y-8">
      <div className="relative mx-auto max-w-md">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2.2}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-[14px] text-foreground shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </div>

      {search.trim() && (
        <p className="text-center text-[14px] text-muted-foreground">
          {totalMatches === 0
            ? "No questions match your search."
            : `${totalMatches} question${totalMatches === 1 ? "" : "s"} found`}
        </p>
      )}

      <div className="space-y-12">
        {filteredCategories.map((cat) => (
          <section key={cat.id}>
            <h2 className="h-display font-display text-[22px] font-bold text-foreground">
              {cat.name}
            </h2>
            {cat.description && (
              <p className="mt-1.5 text-[14px] text-muted-foreground">{cat.description}</p>
            )}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-x-5">
              {cat.faqs.map((faq) => {
                const open = openSlug === faq.slug;
                return (
                  <div
                    key={faq.id}
                    id={faq.slug}
                    className="scroll-mt-24 self-start rounded-lg border border-border bg-card shadow-soft transition-colors hover:border-primary/30"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenSlug(open ? null : faq.slug)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                    >
                      <span className="text-[14px] font-bold text-foreground">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                          open && "rotate-180 text-primary",
                        )}
                        strokeWidth={2.4}
                      />
                    </button>
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-in-out",
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-border px-4 pb-4 pt-3">
                          <p className="whitespace-pre-line text-[14px] leading-relaxed text-foreground/80">
                            {faq.answer}
                          </p>
                          {(faq.tours.length > 0 || faq.destinations.length > 0) && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {faq.tours.map((t) => (
                                <Link
                                  key={t.id}
                                  href={`/tours/${t.slug}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-[12px] font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  {t.title}
                                  <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
                                </Link>
                              ))}
                              {faq.destinations.map((d) => (
                                <Link
                                  key={d.id}
                                  href={`/destinations/${d.slug}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-[12px] font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  {d.name}
                                  <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
