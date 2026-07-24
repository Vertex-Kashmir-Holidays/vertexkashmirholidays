"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqPreviewItem {
  id: string;
  question: string;
  shortAnswer: string;
  slug: string;
}

interface FaqPreviewListProps {
  faqs: FaqPreviewItem[];
  columns?: 1 | 2;
}

// Shared short-answer accordion — used on Homepage, Tour, Destination, About,
// Contact and Blog/Campaign/Activity detail pages. Never renders the full
// answer; that lives only on /faq (see Faq.shortAnswer's schema doc comment
// for why — this keeps the FAQPage JSON-LD on every one of these pages
// honest about what's actually visible). Collapsed by default, one open at a
// time; "Read Full Answer" links to /faq#<slug> — FaqAccordionPage opens and
// scrolls to that exact question on the single knowledge-base page, rather
// than a separate per-question page.
export function FaqPreviewList({ faqs, columns = 1 }: FaqPreviewListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (faqs.length === 0) return null;

  return (
    <div className={columns === 2 ? "grid gap-3 sm:grid-cols-2 sm:gap-x-5" : "space-y-3"}>
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <div
            key={faq.id}
            className="rounded-lg border border-border bg-card shadow-soft transition-colors hover:border-primary/30"
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : faq.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <h3 className="text-[14px] font-bold text-foreground leading-snug">{faq.question}</h3>
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
                <div className="px-4 pb-3.5">
                  <p className="text-[14px] leading-relaxed text-muted-foreground">
                    {faq.shortAnswer}
                  </p>
                  <Link
                    href={`/faq#${faq.slug}`}
                    className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
                  >
                    Read Full Answer
                    <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
