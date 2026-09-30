import Link from "next/link";
import type { ReactNode } from "react";
import { Check, X, ChevronDown, ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/ui/atoms/SafeImage";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { withVideoWatermark } from "@/lib/videoWatermark";
import type { OfferFaq, OfferPoint } from "@/lib/offers/content";
import type { OfferDestinationView } from "@/lib/offers/view";

// Server-rendered sections of the Occasion Offer page — no client JS. Each
// renders nothing when the offer has no content for it, so a sparse offer
// never shows an empty heading.

/** Campaign-style section shell: kicker, heading, optional intro, anchor offset
 *  for the sticky header + section nav. */
export function OfferSection({
  id,
  kicker,
  title,
  intro,
  children,
}: {
  id: string;
  kicker?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-40">
      {kicker && (
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">{kicker}</p>
      )}
      <h2
        id={`${id}-heading`}
        className="h-display mt-2 text-[28px] font-bold leading-tight text-foreground sm:text-[36px]"
      >
        {title}
      </h2>
      {intro && (
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
          {intro}
        </p>
      )}
      <div className="mt-7">{children}</div>
    </section>
  );
}

// The places this trip covers, in visiting order, each linking to its
// destination guide (photo + tagline from the Destination records).
export function OfferRoute({ stops }: { stops: (OfferDestinationView & { days: number[] })[] }) {
  if (stops.length === 0) return null;
  return (
    <ol className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:scroll-px-0 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {stops.map((s, i) => (
        <li key={s.slug} className="w-[70%] shrink-0 snap-start sm:w-auto">
          <Link
            href={`/destinations/${s.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-muted"
          >
            <SafeImage
              src={s.image}
              alt={s.name}
              fill
              sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 70vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-[14px] font-bold text-foreground">
              {i + 1}
            </span>
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/75">
                {s.days.length === 1 ? `Day ${s.days[0]}` : `Days ${s.days.join(", ")}`}
              </p>
              <p className="text-[22px] font-bold">{s.name}</p>
              {s.tagline && <p className="mt-0.5 text-[13px] text-white/80">{s.tagline}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function OfferOverview({ lead, html }: { lead: string | null; html: string | null }) {
  if (!lead && !html) return null;
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
      {lead && <p className="text-[17px] leading-relaxed text-foreground/85">{lead}</p>}
      {html && (
        <div className={lead ? "mt-4" : undefined}>
          <BlogPostBody html={html} />
        </div>
      )}
    </div>
  );
}

export function OfferWhyThisSeason({ points }: { points: OfferPoint[] }) {
  if (points.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {points.map((p, i) => (
        <div key={i} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <span className="text-[13px] font-bold text-primary">0{i + 1}</span>
          <h3 className="mt-2 text-[17px] font-bold text-foreground">{p.title}</h3>
          {p.text && (
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{p.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function OfferInclusions({
  inclusions,
  exclusions,
}: {
  inclusions: string[];
  exclusions: string[];
}) {
  if (inclusions.length === 0 && exclusions.length === 0) return null;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {inclusions.length > 0 && (
        <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-6">
          <h3 className="text-[15px] font-bold text-foreground">Included in every package</h3>
          <ul className="mt-4 space-y-2.5">
            {inclusions.map((item) => (
              <li key={item} className="flex gap-2.5 text-[15px] text-foreground/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {exclusions.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <h3 className="text-[15px] font-bold text-foreground">Not included</h3>
          <ul className="mt-4 space-y-2.5">
            {exclusions.map((item) => (
              <li key={item} className="flex gap-2.5 text-[15px] text-foreground/75">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Campaign film (uploaded videos get the Vertex watermark) + photo gallery. */
export function OfferMedia({
  filmUrl,
  filmPoster,
  gallery,
  alt,
}: {
  filmUrl: string | null;
  filmPoster: string | null;
  gallery: string[];
  alt: string;
}) {
  if (!filmUrl && gallery.length === 0) return null;
  return (
    <div className="space-y-4">
      {filmUrl && (
        <video
          src={withVideoWatermark(filmUrl)}
          poster={filmPoster ?? undefined}
          controls
          preload="none"
          playsInline
          className="aspect-video w-full rounded-3xl bg-black object-cover shadow-soft"
        />
      )}
      {gallery.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.slice(0, 8).map((src, i) => (
            <div
              key={src}
              className={`relative overflow-hidden rounded-2xl bg-muted ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}
            >
              <SafeImage
                src={src}
                alt={`${alt} — photo ${i + 1}`}
                fill
                sizes={
                  i === 0 ? "(min-width: 1024px) 600px, 100vw" : "(min-width: 1024px) 300px, 50vw"
                }
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Native <details> accordion — no client JS. The same question/answer pairs
// feed this page's FAQPage JSON-LD, so the schema never claims hidden content.
export function OfferFaqList({ faqs }: { faqs: OfferFaq[] }) {
  if (faqs.length === 0) return null;
  return (
    <div className="divide-y divide-border rounded-3xl border border-border bg-card px-5 shadow-sm sm:px-8">
      {faqs.map((f, i) => (
        <details key={i} className="group py-5" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[16px] font-semibold text-foreground">
            {f.question}
            <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
            {f.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

export interface OfferLink {
  href: string;
  label: string;
}

// A handful of natural next steps — related tours chosen in admin, the Kashmir
// collection, the Trip Planner and travel stories. Deliberately short.
export function OfferLinks({ links }: { links: OfferLink[] }) {
  if (links.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-[14px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            {l.label}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
